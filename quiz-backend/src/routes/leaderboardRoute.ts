import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import Result from '../models/Result';

const router: Router = express.Router();

// --- 1. GET GLOBAL PLATFORM RANKINGS ---
router.get('/global', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const leaderboard = await Result.aggregate([
      // 1. Exclude custom papers entirely
      { 
        $match: { 
          $or: [
            { customPaperId: { $exists: false } }, 
            { customPaperId: null }
          ] 
        } 
      },
      
      // 2. Break apart the review array so we can process each question individually
      { $unwind: "$review" },

      // 3. Keep ONLY the questions the user answered correctly
      { 
        $match: { 
          "review.userAnswerIndex": { $ne: null },
          $expr: { $eq: ["$review.userAnswerIndex", "$review.correctAnswerIndex"] }
        } 
      },

      // 4. DEDUPLICATE: Group by User AND Question to ensure a question is only counted once per user
      { 
        $group: { 
          _id: { userId: "$userId", question: "$review.question" } 
        } 
      },

      // 5. Look up the question in the DB to find its difficulty
      // (Ensure 'questions' matches your actual MongoDB collection name for questions)
      {
        $lookup: {
          from: "questions", 
          localField: "_id.question",
          foreignField: "question", // Matching by question text
          as: "questionDetails"
        }
      },
      { $unwind: "$questionDetails" },

      // 6. Assign points based on difficulty (Easy: 1, Medium: 3, Hard: 5)
      {
        $addFields: {
          points: {
            $switch: {
              branches: [
                { case: { $eq: ["$questionDetails.difficulty", "Easy"] }, then: 1 },
                { case: { $eq: ["$questionDetails.difficulty", "Medium"] }, then: 3 },
                { case: { $eq: ["$questionDetails.difficulty", "Hard"] }, then: 5 }
              ],
              default: 1 // Fallback just in case
            }
          }
        }
      },

      // 7. Group back by User to sum up their new points
      { 
        $group: { 
          _id: "$_id.userId", 
          totalPoints: { $sum: "$points" } 
        } 
      },

      // 8. Sort, Rank, and format (Same as before)
      { $sort: { totalPoints: -1 } },
      {
        $setWindowFields: {
          sortBy: { totalPoints: -1 },
          output: { rank: { $documentNumber: {} } }
        }
      },
      { $limit: limit },
      { 
        $lookup: {
          from: 'users', 
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      { 
        $project: {
          id: '$_id',
          name: '$userDetails.name',
          points: '$totalPoints',
          rank: 1
        }
      }
    ]);

    res.json({ success: true, data: leaderboard });
  } catch (error: any) {
    console.error("Global Leaderboard Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/cohort/:cohortName', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cohortName } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const leaderboard = await Result.aggregate([
      // 1. Filter by Cohort AND exclude custom papers
      { 
        $match: { 
          cohort: cohortName,
          $or: [
            { customPaperId: { $exists: false } }, 
            { customPaperId: null }
          ]
        } 
      },
      { $unwind: "$review" },
      { 
        $match: { 
          "review.userAnswerIndex": { $ne: null },
          $expr: { $eq: ["$review.userAnswerIndex", "$review.correctAnswerIndex"] }
        } 
      },
      { $group: { _id: { userId: "$userId", question: "$review.question" } } },
      {
        $lookup: {
          from: "questions", 
          localField: "_id.question",
          foreignField: "question",
          as: "questionDetails"
        }
      },
      { $unwind: "$questionDetails" },
      {
        $addFields: {
          points: {
            $switch: {
              branches: [
                { case: { $eq: ["$questionDetails.difficulty", "Easy"] }, then: 1 },
                { case: { $eq: ["$questionDetails.difficulty", "Medium"] }, then: 3 },
                { case: { $eq: ["$questionDetails.difficulty", "Hard"] }, then: 5 }
              ],
              default: 1
            }
          }
        }
      },
      { $group: { _id: "$_id.userId", totalPoints: { $sum: "$points" } } },
      { $sort: { totalPoints: -1 } },
      {
        $setWindowFields: {
          sortBy: { totalPoints: -1 },
          output: { rank: { $documentNumber: {} } }
        }
      },
      { $limit: limit },
      { 
        $lookup: {
          from: 'users', 
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      { 
        $project: {
          id: '$_id',
          name: '$userDetails.name',
          points: '$totalPoints',
          rank: 1,
          cohort: cohortName
        }
      }
    ]);

    res.json({ success: true, data: leaderboard });
  } catch (error: any) {
    console.error("Cohort Leaderboard Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;