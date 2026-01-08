import { NextFunction, Response,Request } from "express"
import asyncHandler from "../utils/asyncHandler"
import Question from "../models/question.model"
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class QuestionController  {
    static createQuestion = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const data = req.body
        const exitingQuestion = await Question.findOne({title:data.title})
        if(exitingQuestion){
            return next(new ErrorResponse('Question already exities',400))
        }
        const newQuestion = await Question.create(data)
        res.status(201).json(new ApiResponse(200,newQuestion,"Question added successfully"))
    })

    static getQuestion = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const exitingQuestion = await Question.findById(id)
        if(!exitingQuestion){
            return next(new ErrorResponse('Question not found',404))
        }
        res.status(200).json(new ApiResponse(200,exitingQuestion,"Question fetch successfully"))
    })

    static getAllQuestion = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        // Get pagination parameters from query with default values
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        // Get search parameter from query
        const search = req.query.search as string;

        // Define the search filter
        let filter = {};
        if (search) {
            filter = {
                $or: [
                    { title: { $regex: search, $options: "i" } },
                ]
            };
        }

        // Calculate the skip value for pagination
        const skip = (page - 1) * limit;

        // Fetch Questions with pagination and search
        const questions = await Question.find(filter)
            .skip(skip)
            .limit(limit);

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

    static updateQuestion = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const data = req.body
        const exitingQuestion = await Question.findById(id)
        if(!exitingQuestion){
            return next(new ErrorResponse('Question not found',404))
        }
        const updateQuestion = await Question.findByIdAndUpdate(id,data)
        res.status(200).json(new ApiResponse(200,updateQuestion,"Question update successfully"))
    })

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

}

export default QuestionController