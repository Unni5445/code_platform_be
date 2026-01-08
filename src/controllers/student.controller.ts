import { NextFunction, Response,Request } from "express"
import asyncHandler from "../utils/asyncHandler"
import Student from "../models/student.model"
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";
import createJWTToken from "../utils/createJwtToken";

class StudentController  {
    static createStudent = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const data = req.body
        const exitingStudent = await Student.findOne({email:data.email})
        if(exitingStudent){
            return next(new ErrorResponse('Student already exities',400))
        }
        const newStudent = await (await Student.create(data)).populate('college')
        res.status(201).json(new ApiResponse(200,newStudent,"Student added successfully"))
    })

    static getStudent = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const exitingStudent = await Student.findById(id).select('-password')
        if(!exitingStudent){
            return next(new ErrorResponse('Student not found',404))
        }
        res.status(200).json(new ApiResponse(200,exitingStudent,"Student fetch successfully"))
    })

    static getAllStudent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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

        // Fetch Students with pagination and search
        const students = await Student.find(filter)
            .populate('college')
            .select('-password')
            .skip(skip)
            .limit(limit);

        // Count total Students matching the filter for total pages calculation
        const totalStudents = await Student.countDocuments(filter);
        const totalPages = Math.ceil(totalStudents / limit);

        // Return paginated and filtered list with current page and total pages
        res.status(200).json(new ApiResponse(200, {
            students: students,
            currentPage: page,
            totalPages,
            totalStudents
        }, "Students retrieved successfully"));
    });

    static updateStudent = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const data = req.body
        const exitingStudent = await Student.findById(id)
        if(!exitingStudent){
            return next(new ErrorResponse('Student not found',404))
        }
        const updateStudent = await Student.findByIdAndUpdate(id,data)
        res.status(200).json(new ApiResponse(200,updateStudent,"Student update successfully"))
    })

    static deleteStudent = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {id} = req.params
        const exitingStudent = await Student.findById(id)
        if(!exitingStudent){
            return next(new ErrorResponse('Student not found',404))
        }
        exitingStudent.isDeleted = true
        await exitingStudent.save()
        res.status(200).json(new ApiResponse(200,{},"Student delete successfully"))
    })

    static getAllStudentsForDropdown = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const students = await Student.find().select('_id name college').populate('college');
        res.status(200).json(new ApiResponse(200, students, "Students retrieved successfully for dropdown"));
    });

    static signinStudent = asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new ErrorResponse("Please provide valid data", 400));
        }

        const student:any = await Student.findOne({ email })
        if (!student) {
            return next(new ErrorResponse("Invalid email", 400));
        }
        const comparePassword = await student.comparePassword(password)
        if(student && !comparePassword){
            return next(new ErrorResponse("Invalid Password", 400));
        }
        const token = createJWTToken(student._id.toString(),"student")
        res.cookie('token',token,{
            httpOnly : true,
            secure : process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none": "lax",
            maxAge: 24 * 60 * 60 * 1000
        })
        res
            .status(200)
            .json(new ApiResponse(200, {token,_id:student._id,email:student.email,role:"student"}, "Student logged in successfully"));
        }
    );

    static signOut = asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
        res.clearCookie('token').status(200).json(new ApiResponse(200,{},'Logout Successfully'))
        }
    )
    
    static getStudentByToken = asyncHandler(
        async(req:Request,res:Response,next:NextFunction)=>{
        const {_id,email,name} = req.student
        res.json(new ApiResponse(200,{_id,email,name,role:"student"}))
    }
  )
}

export default StudentController