import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as dynamoose from "dynamoose";
import exp from "constants";
import {
  clerkMiddleware,
  createClerkClient,
  requireAuth,
} from "@clerk/express";

/* Route Imports*/

import CourseRoutes from "./routes/CourseRoutes";
import userClerkRoutes from "./routes/userClerkRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import UserCourseProgressRoutes from "./routes/userCourseProgressRoutes";
import ServerlessHttp from "serverless-http";
import seed from "./seed/seedDynamodb";

/*Config*/

dotenv.config();

const isProduction = process.env.Node_ENV === "production";

if (!isProduction) {
  dynamoose.aws.ddb.local();
}

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(clerkMiddleware());

/*ROUTES*/
app.get("/", (req, res) => {
  res.send("HELLO WORLD");
});

app.use("/courses", CourseRoutes);
app.use("/user/clerk", requireAuth(), userClerkRoutes);
app.use("/transactions", requireAuth(), transactionRoutes);
app.use("/users/course-progress", requireAuth(), UserCourseProgressRoutes);

/*SERVER*/

const port = process.env.PORT || 3000;
if (!isProduction) {
  app.listen(port, () => {
    console.log(`Server running at port ${port}`);
  });
}

/*Serverless*/

const serverlessApp = ServerlessHttp(app);
export const handler = async (event: any, context: any) => {
  if (event.action === "seed") {
    await seed();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data Seeded Successfully" }),
    };
  } else {
    return serverlessApp(event, context);
  }
};
