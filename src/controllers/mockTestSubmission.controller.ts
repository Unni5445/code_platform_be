import { NextFunction, Response,Request } from "express"
import asyncHandler from "../utils/asyncHandler"
import MockTestSubmission from "../models/mockTestSubmission.model"
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class MockTestSubmissionController  {
    static createMockTestSubmission = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const data = req.body
        const newMockTestSubmission = await MockTestSubmission.create(data)
        res.status(201).json(new ApiResponse(200,newMockTestSubmission,"MockTestSubmission added successfully"))
    })

    static getMockTestSubmission = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const exitingMockTestSubmission = await MockTestSubmission.findById(id)
        if(!exitingMockTestSubmission){
            return next(new ErrorResponse('MockTestSubmission not found',404))
        }
        res.status(200).json(new ApiResponse(200,exitingMockTestSubmission,"MockTestSubmission fetch successfully"))
    })

    static getAllMockTestSubmission = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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

        // Fetch MockTestSubmissions with pagination and search
        const mockTestSubmissions = await MockTestSubmission.find(filter)
            .skip(skip)
            .limit(limit);

        // Count total MockTestSubmissions matching the filter for total pages calculation
        const totalMockTestSubmissions = await MockTestSubmission.countDocuments(filter);
        const totalPages = Math.ceil(totalMockTestSubmissions / limit);

        // Return paginated and filtered list with current page and total pages
        res.status(200).json(new ApiResponse(200, {
            mockTestSubmissions: mockTestSubmissions,
            currentPage: page,
            totalPages,
            totalMockTestSubmissions
        }, "Mock Test Submissions retrieved successfully"));
    });

    static updateMockTestSubmission = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const data = req.body
        const exitingMockTestSubmission = await MockTestSubmission.findById(id)
        if(!exitingMockTestSubmission){
            return next(new ErrorResponse('Mock Test Submission not found',404))
        }
        const updateMockTestSubmission = await MockTestSubmission.findByIdAndUpdate(id,data)
        res.status(200).json(new ApiResponse(200,updateMockTestSubmission,"MockTestSubmission update successfully"))
    })

    static deleteMockTestSubmission = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const exitingMockTestSubmission = await MockTestSubmission.findById(id)
        if(!exitingMockTestSubmission){
            return next(new ErrorResponse('Mock Test Submission not found',404))
        }
        exitingMockTestSubmission.isDeleted = true
        await exitingMockTestSubmission.save()
        res.status(200).json(new ApiResponse(200,{},"Mock Test Submission delete successfully"))
    })

}

export default MockTestSubmissionController