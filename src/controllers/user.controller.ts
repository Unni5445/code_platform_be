import { NextFunction, Response,Request } from "express"
import asyncHandler from "../utils/asyncHandler"
import User from "../models/user.model"
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class UserController  {
    static createUser = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const data = req.body
        const exitingUser = await User.findOne({email:data.email})
        if(exitingUser){
            return next(new ErrorResponse('User already exities',400))
        }
        const newUser = await User.create(data)
        res.status(201).json(new ApiResponse(200,newUser,"User added successfully"))
    })

    static getUser = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const exitingUser = await User.findById(id).select('-password')
        if(!exitingUser){
            return next(new ErrorResponse('User not found',404))
        }
        res.status(200).json(new ApiResponse(200,exitingUser,"User fetch successfully"))
    })

    static getAllUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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
                    { email: { $regex: search, $options: "i" } },
                ]
            };
        }

        // Calculate the skip value for pagination
        const skip = (page - 1) * limit;

        // Fetch Users with pagination and search
        const users = await User.find(filter)
            .select('-password')
            .skip(skip)
            .limit(limit);

        // Count total Users matching the filter for total pages calculation
        const totalUsers = await User.countDocuments(filter);
        const totalPages = Math.ceil(totalUsers / limit);

        // Return paginated and filtered list with current page and total pages
        res.status(200).json(new ApiResponse(200, {
            users: users,
            currentPage: page,
            totalPages,
            totalUsers
        }, "Users retrieved successfully"));
    });

    static updateUser = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const data = req.body
        const exitingUser = await User.findById(id)
        if(!exitingUser){
            return next(new ErrorResponse('User not found',404))
        }
        const updateUser = await User.findByIdAndUpdate(id,data)
        res.status(200).json(new ApiResponse(200,updateUser,"User update successfully"))
    })

    static deleteUser = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const exitingUser = await User.findById(id)
        if(!exitingUser){
            return next(new ErrorResponse('User not found',404))
        }
        exitingUser.isDeleted = true
        await exitingUser.save()
        res.status(200).json(new ApiResponse(200,{},"User delete successfully"))
    })

    static getAllUsersForDropdown = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const users = await User.find().select('_id name');
        res.status(200).json(new ApiResponse(200, users, "Users retrieved successfully for dropdown"));
    });
    
}

export default UserController