import { NextFunction, Response, Request } from "express"
import asyncHandler from "../utils/asyncHandler"
import Question from "../models/question.model"
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class QuestionController {
    // Create a new question
    static createQuestion = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const data = req.body
        const exitingQuestion = await Question.findOne({title:data.title})
        if(exitingQuestion){
            return next(new ErrorResponse('Question already exists',400))
        }
        const newQuestion = await Question.create(data)
        res.status(201).json(new ApiResponse(200,newQuestion,"Question added successfully"))
    })

    // Get question by ID
    static getQuestion = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const exitingQuestion = await Question.findById(id)
        if(!exitingQuestion){
            return next(new ErrorResponse('Question not found',404))
        }
        res.status(200).json(new ApiResponse(200,exitingQuestion,"Question fetch successfully"))
    })

    // Get question by slug (LeetCode style)
    static getQuestionBySlug = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {slug} = req.params
        const question = await Question.findOne({problemSlug: slug, isDeleted: false})
        if(!question){
            return next(new ErrorResponse('Question not found',404))
        }
        res.status(200).json(new ApiResponse(200,question,"Question fetch successfully"))
    })

    // Get all questions with pagination, search, and filters
    static getAllQuestion = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        // Get pagination parameters from query with default values
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        // Get search and filter parameters from query
        const search = req.query.search as string;
        const difficulty = req.query.difficulty as string;
        const topic = req.query.topic as string;
        const company = req.query.company as string;
        const type = req.query.type as string;

        // Define the search filter
        let filter: any = { isDeleted: false };
        
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        
        if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
            filter.difficulty = difficulty;
        }
        
        if (topic) {
            filter.topics = topic;
        }
        
        if (company) {
            filter['companies.name'] = company;
        }
        
        if (type && ['single_choice_mcq', 'multi_choice_mcq', 'coding'].includes(type)) {
            filter.type = type;
        }

        // Calculate the skip value for pagination
        const skip = (page - 1) * limit;

        // Fetch Questions with pagination and search
        const questions = await Question.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ problemNumber: 1, createdAt: -1 });

        // Count total Questions matching the filter for total pages calculation
        const totalQuestions = await Question.countDocuments(filter);
        const totalPages = Math.ceil(totalQuestions / limit);

        // Return paginated and filtered list with current page and total pages
        res.status(200).json(new ApiResponse(200, {
            questions: questions,
            currentPage: page,
            totalPages,
            totalQuestions
        }, "Questions retrieved successfully"));
    });

    // Update question
    static updateQuestion = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const data = req.body
        const exitingQuestion = await Question.findById(id)
        if(!exitingQuestion){
            return next(new ErrorResponse('Question not found',404))
        }
        const updateQuestion = await Question.findByIdAndUpdate(id,data,{new: true})
        res.status(200).json(new ApiResponse(200,updateQuestion,"Question update successfully"))
    })

    // Delete question (soft delete)
    static deleteQuestion = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const exitingQuestion = await Question.findById(id)
        if(!exitingQuestion){
            return next(new ErrorResponse('Question not found',404))
        }
        exitingQuestion.isDeleted = true
        await exitingQuestion.save()
        res.status(200).json(new ApiResponse(200,{},"Question delete successfully"))
    })

    // Get questions by difficulty
    static getQuestionsByDifficulty = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {difficulty} = req.params
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return next(new ErrorResponse('Invalid difficulty level',400))
        }
        const questions = await Question.find({ difficulty, isDeleted: false })
            .sort({ problemNumber: 1 })
        res.status(200).json(new ApiResponse(200,questions,`Questions with ${difficulty} difficulty fetched successfully`))
    })

    // Get questions by topic
    static getQuestionsByTopic = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {topic} = req.params
        const questions = await Question.find({ topics: topic, isDeleted: false })
            .sort({ problemNumber: 1 })
        res.status(200).json(new ApiResponse(200,questions,`Questions for topic '${topic}' fetched successfully`))
    })

    // Get questions by company
    static getQuestionsByCompany = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {company} = req.params
        const questions = await Question.find({ "companies.name": company, isDeleted: false })
            .sort({ "companies.frequency": -1, problemNumber: 1 })
        res.status(200).json(new ApiResponse(200,questions,`Questions asked by '${company}' fetched successfully`))
    })

    // Get popular questions
    static getPopularQuestions = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const limit = parseInt(req.query.limit as string) || 10
        const questions = await Question.find({ isDeleted: false })
            .sort({ submissionsCount: -1 })
            .limit(limit)
        res.status(200).json(new ApiResponse(200,questions,`Top ${limit} popular questions fetched successfully`))
    })

    // Get questions sorted by acceptance rate
    static getQuestionsByAcceptanceRate = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const ascending = req.query.ascending === 'true'
        const questions = await Question.find({ isDeleted: false })
            .sort({ acceptanceRate: ascending ? 1 : -1 })
        res.status(200).json(new ApiResponse(200,questions,`Questions sorted by acceptance rate (${ascending ? 'low to high' : 'high to low'}) fetched successfully`))
    })

    // Get all topics
    static getAllTopics = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const topics = await Question.distinct('topics', { isDeleted: false })
        res.status(200).json(new ApiResponse(200,topics,"All topics fetched successfully"))
    })

    // Get all companies
    static getAllCompanies = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const questions = await Question.find({ isDeleted: false }).select('companies')
        const companyMap = new Map<string, number>()
        
        questions.forEach(q => {
            if (q.companies) {
                q.companies.forEach(c => {
                    const currentCount = companyMap.get(c.name) || 0
                    companyMap.set(c.name, currentCount + c.frequency)
                })
            }
        })
        
        const companies = Array.from(companyMap.entries())
            .map(([name, frequency]) => ({ name, frequency }))
            .sort((a, b) => b.frequency - a.frequency)
        
        res.status(200).json(new ApiResponse(200,companies,"All companies fetched successfully"))
    })

    // Get hints for a question
    static getHints = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const question = await Question.findById(id)
        if(!question){
            return next(new ErrorResponse('Question not found',404))
        }
        res.status(200).json(new ApiResponse(200,question.hints || [],"Hints fetched successfully"))
    })

    // Get editorial for a question
    static getEditorial = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const question = await Question.findById(id)
        if(!question){
            return next(new ErrorResponse('Question not found',404))
        }
        if (!question.editorial) {
            return next(new ErrorResponse('Editorial not available for this question',404))
        }
        res.status(200).json(new ApiResponse(200,question.editorial,"Editorial fetched successfully"))
    })

    // Update question statistics (acceptance rate, submissions, etc.)
    static updateStatistics = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const { accepted } = req.body
        
        const question = await Question.findById(id)
        if(!question){
            return next(new ErrorResponse('Question not found',404))
        }
        
        // Update submission count
        question.submissionsCount = (question.submissionsCount || 0) + 1
        
        // Update accepted count if submission was accepted
        if (accepted) {
            question.acceptedCount = (question.acceptedCount || 0) + 1
        }
        
        // Recalculate acceptance rate
        if (question.submissionsCount && question.submissionsCount > 0 && question.acceptedCount !== undefined) {
            question.acceptanceRate = Math.round((question.acceptedCount / question.submissionsCount) * 100 * 100) / 100;
        }
        
        await question.save()
        
        res.status(200).json(new ApiResponse(200,question,"Statistics updated successfully"))
    })

    // Get similar problems
    static getSimilarProblems = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const question = await Question.findById(id)
        if(!question){
            return next(new ErrorResponse('Question not found',404))
        }
        
        // Get similar problems from the question's similarProblems array
        const similarProblems = question.similarProblems || []
        
        // Also find problems with same topics
        const topicBasedSimilar = await Question.find({
            _id: { $ne: id },
            topics: { $in: question.topics || [] },
            difficulty: question.difficulty,
            isDeleted: false
        }).limit(5)
        
        res.status(200).json(new ApiResponse(200,{
            directSimilar: similarProblems,
            topicBasedSimilar: topicBasedSimilar
        },"Similar problems fetched successfully"))
    })
}

export default QuestionController