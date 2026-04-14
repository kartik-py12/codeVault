import submission from "../models/submission.js";
import { publishToQueue } from "../utils/rabbitmq.js";
import mongoose from "mongoose";
import axios from "axios";

const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

const toTitleSlug = (title = "") => {
        return title
                .toLowerCase()
                .replace(/&/g, " and ")
                .replace(/[()]/g, " ")
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "");
};

const getSlugFromExternalUrl = (externalUrl = "") => {
        const match = externalUrl.match(/leetcode\.com\/problems\/([^/]+)/i);
        return match?.[1] || "";
};

const fetchLeetCodeProblemMetadata = async (problemTitle, externalUrl = "") => {
        const titleSlug = getSlugFromExternalUrl(externalUrl) || toTitleSlug(problemTitle);
        if (!titleSlug) return null;

        const query = `
            query questionData($titleSlug: String!) {
                question(titleSlug: $titleSlug) {
                    title
                    difficulty
                    content
                    topicTags {
                        name
                    }
                }
            }
        `;

        const response = await axios.post(
                "https://leetcode.com/graphql",
                {
                        query,
                        variables: { titleSlug }
                },
                {
                        headers: {
                                "Content-Type": "application/json"
                        },
                        timeout: 8000
                }
        );

        const question = response?.data?.data?.question;
        if (!question) return null;

        return {
                titleSlug,
                difficulty: question.difficulty || "Unknown",
                problemContent: question.content || "",
                topicTags: Array.isArray(question.topicTags) ? question.topicTags.map((tag) => tag?.name).filter(Boolean) : [],
                externalUrl: `https://leetcode.com/problems/${titleSlug}/`
        };
};

export const syncLeetCodeSubmission = async (req, res) => {
    try {
        const { stats, userCode, problemDetails, syncType } = req.body;
        const userId = req.user.id;
        const normalizedSyncType = syncType === "TODO" ? "TODO" : "GITHUB_SYNC";
        const isTodoSync = normalizedSyncType === "TODO";
        const safeLanguage = stats?.lang || "text";
        const safeCode = userCode || "// TODO: Solution not submitted yet";
        const titleSlug = problemDetails?.titleSlug || "";
        const externalUrl = titleSlug ? `https://leetcode.com/problems/${titleSlug}/` : "";
        const topicTags = Array.isArray(problemDetails?.topicTags)
            ? problemDetails.topicTags.map((tag) => tag?.name).filter(Boolean)
            : [];
        const initialStatus = isTodoSync ? "TODO" : "PENDING";
        
        console.log("Received sync request:", {
            userId,
            problemTitle: problemDetails?.title,
            syncType: normalizedSyncType,
            stats
        });
        
        const newSubmission = await submission.create({
            userId,
            problemTitle: problemDetails?.title || "Untitled Problem",
            code: safeCode,
            language: safeLanguage,
            platform: "LeetCode",
            difficulty: problemDetails?.difficulty || "Unknown",
            problemContent: problemDetails?.content || "",
            topicTags,
            externalUrl,
            syncType: normalizedSyncType,
            status: initialStatus
        });

        if (isTodoSync) {
            return res.status(200).json({
                success: true,
                message: "Problem added to TODO in CodeVault.",
                submissionId: newSubmission._id
            });
        }

        const jobPayload = {
            submissionId: newSubmission._id,
            userId,
            problemTitle: problemDetails?.title,
            code: safeCode,
            stats: stats,
            problemDetails
        };

        

        await publishToQueue("github_sync_queue", jobPayload);
        await publishToQueue("gemini_notes_queue", jobPayload);
    
        return res.status(200).json({
            success: true,
            message: "Submission received and queued for processing."
        });
        
    } catch (error) {
        console.error("❌ Error processing sync request:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

export const getUserSubmissions = async (req, res) => {
    try {
        const userId = req.user.id;
        const latestOnly = req.query.latest === "true";

        if (latestOnly) {
            const pipeline = [
                {
                    $match: {
                        userId: new mongoose.Types.ObjectId(userId)
                    }
                },
                {
                    $sort: {
                        updatedAt: -1,
                        createdAt: -1
                    }
                },
                {
                    $group: {
                        _id: "$problemTitle",
                        latest: { $first: "$$ROOT" }
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: "$latest"
                    }
                },
                {
                    $sort: {
                        updatedAt: -1
                    }
                },
                {
                    $project: {
                        _id: 1,
                        problemTitle: 1,
                        language: 1,
                        status: 1,
                        difficulty: 1,
                        topicTags: 1,
                        platform: 1,
                        externalUrl: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                }
            ];

            const submissions = await submission.aggregate(pipeline);
            return res.status(200).json({ success: true, submissions });
        }

        const submissions = await submission
            .find({ userId })
            .sort({ createdAt: -1 })
            .select("_id problemTitle language status difficulty topicTags platform externalUrl aiNotes code problemContent syncType createdAt updatedAt")
            .lean();

        return res.status(200).json({ success: true, submissions });
    } catch (error) {
        console.error("Error fetching submissions:", error.message);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

export const getUserProblemSubmissions = async (req, res) => {
    try {
        const userId = req.user.id;
        const problemTitle = decodeURIComponent(req.params.problemTitle || "").trim();

        console.log("[getUserProblemSubmissions] Incoming request", {
            userId,
            problemTitle
        });

        if (!problemTitle) {
            return res.status(400).json({ success: false, error: "Problem title is required" });
        }

        const submissions = await submission
            .find({ userId, problemTitle })
            .sort({ createdAt: -1 })
            .select("_id problemTitle code language status difficulty topicTags platform externalUrl problemContent aiNotes syncType createdAt updatedAt")
            .lean();

        console.log("[getUserProblemSubmissions] Fetched submissions", {
            count: submissions.length
        });

        if (!submissions.length) {
            return res.status(404).json({ success: false, error: "No submissions found for this problem" });
        }

        const latestSubmission = { ...submissions[0] };
        const firstDefinedValue = (key, fallbackValue = "") => {
            const found = submissions.find((item) => {
                const value = item?.[key];
                if (Array.isArray(value)) {
                    return value.length > 0;
                }
                return value !== undefined && value !== null && String(value).trim() !== "";
            });

            if (!found) return fallbackValue;
            return found[key];
        };

        // Backfill metadata from older entries when any row is sparse.
        const mergedMetadata = {
            problemContent: firstDefinedValue("problemContent", ""),
            topicTags: firstDefinedValue("topicTags", []),
            difficulty: firstDefinedValue("difficulty", "Unknown"),
            platform: firstDefinedValue("platform", "LeetCode"),
            externalUrl: firstDefinedValue("externalUrl", "")
        };

        const needsHydration =
            isBlank(mergedMetadata.problemContent) ||
            !Array.isArray(mergedMetadata.topicTags) ||
            mergedMetadata.topicTags.length === 0 ||
            mergedMetadata.difficulty === "Unknown";

        if (needsHydration) {
            try {
                const fetchedMetadata = await fetchLeetCodeProblemMetadata(problemTitle, mergedMetadata.externalUrl);
                if (fetchedMetadata) {
                    mergedMetadata.problemContent = fetchedMetadata.problemContent || mergedMetadata.problemContent;
                    mergedMetadata.topicTags = fetchedMetadata.topicTags?.length ? fetchedMetadata.topicTags : mergedMetadata.topicTags;
                    mergedMetadata.difficulty = fetchedMetadata.difficulty || mergedMetadata.difficulty;
                    mergedMetadata.externalUrl = fetchedMetadata.externalUrl || mergedMetadata.externalUrl;

                    await submission.updateMany(
                        { userId, problemTitle },
                        {
                            $set: {
                                problemContent: mergedMetadata.problemContent,
                                topicTags: mergedMetadata.topicTags,
                                difficulty: mergedMetadata.difficulty,
                                externalUrl: mergedMetadata.externalUrl,
                                platform: "LeetCode"
                            }
                        }
                    );

                    console.log("[getUserProblemSubmissions] Hydrated sparse metadata from LeetCode", {
                        problemTitle,
                        difficulty: mergedMetadata.difficulty,
                        topicCount: mergedMetadata.topicTags.length,
                        hasProblemContent: Boolean(mergedMetadata.problemContent)
                    });
                }
            } catch (metadataError) {
                console.warn("[getUserProblemSubmissions] Metadata hydration failed", {
                    problemTitle,
                    reason: metadataError.message
                });
            }
        }

        latestSubmission.problemContent = mergedMetadata.problemContent;
        latestSubmission.topicTags = mergedMetadata.topicTags;
        latestSubmission.difficulty = mergedMetadata.difficulty;
        latestSubmission.platform = mergedMetadata.platform;
        latestSubmission.externalUrl = mergedMetadata.externalUrl;

        const enrichedSubmissions = submissions.map((item) => ({
            ...item,
            problemContent: item.problemContent || mergedMetadata.problemContent,
            topicTags: (Array.isArray(item.topicTags) && item.topicTags.length) ? item.topicTags : mergedMetadata.topicTags,
            difficulty: item.difficulty && item.difficulty !== "Unknown" ? item.difficulty : mergedMetadata.difficulty,
            platform: item.platform || mergedMetadata.platform,
            externalUrl: item.externalUrl || mergedMetadata.externalUrl
        }));

        console.log("[getUserProblemSubmissions] Returning metadata", {
            difficulty: latestSubmission.difficulty,
            topicCount: Array.isArray(latestSubmission.topicTags) ? latestSubmission.topicTags.length : 0,
            hasProblemContent: Boolean(latestSubmission.problemContent),
            submissionCount: enrichedSubmissions.length
        });

        return res.status(200).json({
            success: true,
            latestSubmission,
            problem: {
                title: latestSubmission.problemTitle,
                description: latestSubmission.problemContent,
                topics: latestSubmission.topicTags,
                difficulty: latestSubmission.difficulty,
                platform: latestSubmission.platform,
                externalUrl: latestSubmission.externalUrl
            },
            submissions: enrichedSubmissions
        });
    } catch (error) {
        console.error("Error fetching problem submissions:", error.message);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};