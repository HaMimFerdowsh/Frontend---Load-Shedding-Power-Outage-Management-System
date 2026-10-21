import { createBrowserRouter } from "react-router";
import Root from "../layout/Root";
import AdminLayout from "../layout/AdminLayout";
import PrivateRoutes from "./PrivateRoutes";
import AdminProtected from "./AdminProtected";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Schedules from "../pages/Schedules";
import ReportOutage from "../pages/ReportOutage";
import MyOutages from "../pages/MyOutages";
import UserProfile from "../pages/UserProfile";
import ChangePassword from "../pages/ChangePassword";

import ManageAreas from "../pages/admin/ManageAreas";
import ManageSchedules from "../pages/admin/ManageSchedules";
import ManageOutages from "../pages/admin/ManageOutages";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/login",
        element: <Login />
      },
      {
        path: "/signup",
        element: <Signup />
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />
      },
      {
        path: "/reset-password",
        element: <ResetPassword />
      },
      {
        path: "/schedules",
        element: <PrivateRoutes><Schedules /></PrivateRoutes>
      },
      {
        path: "/outages/report",
        element: <PrivateRoutes><ReportOutage /></PrivateRoutes>
      },
      {
        path: "/outages/my",
        element: <PrivateRoutes><MyOutages /></PrivateRoutes>
      },
      {
        path: "/user/profile",
        element: <PrivateRoutes><UserProfile /></PrivateRoutes>
      },
      {
        path: "/change-password",
        element: <PrivateRoutes><ChangePassword /></PrivateRoutes>
      }
    ]
  },

  {
    path: "/admin",
    element: <AdminProtected><AdminLayout /></AdminProtected>,
    children: [
      {
        path: 'manage-area',
        element: <ManageAreas />
      },
      {
        path: 'manage-schedule',
        element: <ManageSchedules />
      },
      {
        path: 'manage-outage',
        element: <ManageOutages />
      }
    ]
  }
]);

export default router;