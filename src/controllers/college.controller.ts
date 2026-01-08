import { NextFunction, Response,Request } from "express"
import asyncHandler from "../utils/asyncHandler"
import College from "../models/college.model"
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class CollegeController  {
    static createCollege = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const data = req.body
        const exitingCollege = await College.findOne({name:data.name})
        if(exitingCollege){
            return next(new ErrorResponse('College already exities',400))
        }
        const newCollege = await College.create(data)
        res.status(201).json(new ApiResponse(200,newCollege,"College added successfully"))
    })

    static getCollege = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const exitingCollege = await College.findById(id)
        if(!exitingCollege){
            return next(new ErrorResponse('College not found',404))
        }
        res.status(200).json(new ApiResponse(200,exitingCollege,"College fetch successfully"))
    })

    static getAllCollege = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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

        // Fetch Colleges with pagination and search
       const collegesWithStudentCount = await College.aggregate([
        { $match: filter }, // apply any filters on colleges
        {
            $lookup: {
            from: "students",        // MongoDB collection name for Student
            localField: "_id",       // College _id
            foreignField: "college", // field in Student that references College
            as: "students",
            },
        },
        {
            $addFields: {
            studentCount: { $size: "$students" }, // count of students per college
            },
        },
        { $project: { students: 0 } }, // remove the full student array
        { $skip: skip },
        { $limit: limit },
        ]);


        // Count total Colleges matching the filter for total pages calculation
        const totalColleges = await College.countDocuments(filter);
        const totalPages = Math.ceil(totalColleges / limit);

        // Return paginated and filtered list with current page and total pages
        res.status(200).json(new ApiResponse(200, {
            colleges: collegesWithStudentCount,
            currentPage: page,
            totalPages,
            totalColleges
        }, "Colleges retrieved successfully"));
    });

    static updateCollege = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const data = req.body
        const exitingCollege = await College.findById(id)
        if(!exitingCollege){
            return next(new ErrorResponse('College not found',404))
        }
        const updateCollege = await College.findByIdAndUpdate(id,data)
        res.status(200).json(new ApiResponse(200,updateCollege,"College update successfully"))
    })

    static deleteCollege = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const exitingCollege = await College.findById(id)
        if(!exitingCollege){
            return next(new ErrorResponse('College not found',404))
        }
        exitingCollege.isDeleted = true
        await exitingCollege.save()
        res.status(200).json(new ApiResponse(200,{},"College delete successfully"))
    })

    static getAllCollegesForDropdown = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const colleges = await College.find().select('_id name');
        res.status(200).json(new ApiResponse(200, colleges, "Colleges retrieved successfully for dropdown"));
    });
    
}

export default CollegeController