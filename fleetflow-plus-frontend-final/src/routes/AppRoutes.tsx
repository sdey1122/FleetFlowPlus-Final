import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import AdminWrapper from "../wrappers/AdminWrapper";
import UserWrapper from "../wrappers/UserWrapper";
import DispatcherWrapper from "../wrappers/DispatcherWrapper";
import DriverWrapper from "../wrappers/DriverWrapper";
const Home = lazy(() => import("../pages/HomePage"));
const Admin = lazy(() => import("../pages/AdminPages/AdminDashboard"));
const Customer = lazy(() => import("../pages/userPages/CustomerDashboard"));
const Dispatcher = lazy(
  () => import("../pages/dispatcherPages/DispatcherDashboard"),
);
const Driver = lazy(() => import("../pages/driverPages/DriverDashboard"));
const NotFound = lazy(() => import("../pages/NotFoundPage"));
export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      {
        element: <DashboardLayout />,
        children: [
          {
            element: <AdminWrapper />,
            children: [{ path: "admin/dashboard", element: <Admin /> }],
          },
          {
            element: <UserWrapper />,
            children: [{ path: "customer/dashboard", element: <Customer /> }],
          },
          {
            element: <DispatcherWrapper />,
            children: [
              { path: "dispatcher/dashboard", element: <Dispatcher /> },
            ],
          },
          {
            element: <DriverWrapper />,
            children: [{ path: "driver/dashboard", element: <Driver /> }],
          },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
