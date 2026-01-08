import { NextFunction, Response, Request } from "express";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import ErrorResponse from "../utils/errorResponse";
import User from "../models/user.model";
import createJWTToken from "../utils/createJwtToken";

class UserController {
  static signinUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorResponse("Please provide valid data", 400));
      }

      const employee:any = await User.findOne({ email })
      if (!employee) {
        return next(new ErrorResponse("Invalid email", 400));
      }
      const comparePassword = await employee.comparePassword(password)
      if(employee && !comparePassword){
        return next(new ErrorResponse("Invalid Password", 400));
      }
      const token = createJWTToken(employee._id.toString(),employee.role)
      res.cookie('token',token,{
        httpOnly : true,
        secure : process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none": "lax",
        maxAge: 24 * 60 * 60 * 1000
      })
      res
        .status(200)
        .json(new ApiResponse(200, {token,role:employee.role,_id:employee._id,name:employee.name,email:employee.email}, "User logged in successfully"));
    }
  );

  static signOut = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      res.clearCookie('token').status(200).json(new ApiResponse(200,{},'Logout Successfully'))
    }
  )

  static resetPassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {id} = req.params
      const {newPassword,confirmPassword} = req.body 
      if(newPassword !== confirmPassword){
        return next(new ErrorResponse('password mismatch',400))
      }
      const employee = await User.findById(id)
      if(!employee){
        return next(new ErrorResponse('Employee not found',404))
      }
      employee.password = newPassword
      // employee.isFirstLogin = false
      await employee.save()
      res.status(200).json(new ApiResponse(200,{},'Password reset successfully'))
    }
  )

  static getUserByToken = asyncHandler(
    async(req:Request,res:Response,next:NextFunction)=>{
      const {_id,role,email,name} = req.user
      res.json(new ApiResponse(200,{_id,role,email,name}))
    }
  )
}

export default UserController;
