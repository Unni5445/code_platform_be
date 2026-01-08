import { NextFunction, Response,Request } from "express"
import asyncHandler from "../utils/asyncHandler"
import MockTest from "../models/mocktest.model"
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class MockTestController  {
    static createMockTest = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const data = req.body
        const exitingMockTest = await MockTest.findOne({title:data.title})
        if(exitingMockTest){
            return next(new ErrorResponse('MockTest already exities',400))
        }
        const newMockTest = await MockTest.create(data)
        res.status(201).json(new ApiResponse(200,newMockTest,"Mock Test added successfully"))
    })

    static getMockTest = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const exitingMockTest = await MockTest.findById(id).populate('questions.question')
        if(!exitingMockTest){
            return next(new ErrorResponse('Mock Test not found',404))
        }
        res.status(200).json(new ApiResponse(200,exitingMockTest,"Mock Test fetch successfully"))
    })

    static getAllMockTest = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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
                    { name: { $regex: search, $options: "i" } },
                ]
            };
        }

        // Calculate the skip value for pagination
        const skip = (page - 1) * limit;

        // Fetch MockTests with pagination and search
        const mockTests = await MockTest.find(filter)
            .populate('questions.question')
            .skip(skip)
            .limit(limit);

        // Count total MockTests matching the filter for total pages calculation
        const totalMockTests = await MockTest.countDocuments(filter);
        const totalPages = Math.ceil(totalMockTests / limit);

        // Return paginated and filtered list with current page and total pages
        res.status(200).json(new ApiResponse(200, {
            mockTests: mockTests,
            currentPage: page,
            totalPages,
            totalMockTests
        }, "Mock Tests retrieved successfully"));
    });

    static updateMockTest = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const data = req.body
        const exitingMockTest = await MockTest.findById(id)
        if(!exitingMockTest){
            return next(new ErrorResponse('Mock Test not found',404))
        }
        const updateMockTest = await MockTest.findByIdAndUpdate(id,data)
        res.status(200).json(new ApiResponse(200,updateMockTest,"Mock Test update successfully"))
    })

    static deleteMockTest = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const exitingMockTest = await MockTest.findById(id)
        if(!exitingMockTest){
            return next(new ErrorResponse('Mock Test not found',404))
        }
        exitingMockTest.isDeleted = true
        await exitingMockTest.save()
        res.status(200).json(new ApiResponse(200,{},"Mock Test delete successfully"))
    })

    static getAllMockTestsForDropdown = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const MockTests = await MockTest.find().select('_id title');
        res.status(200).json(new ApiResponse(200, MockTests, "Mock Tests retrieved successfully for dropdown"));
    });
    
}

export default MockTestController