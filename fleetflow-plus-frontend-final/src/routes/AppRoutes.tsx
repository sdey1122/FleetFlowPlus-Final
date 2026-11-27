import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import AppRuntime from "../layouts/AppRuntime";
import MainLayout from "../layouts/MainLayout";
import AdminWrapper from "../wrappers/AdminWrapper";
import UserWrapper from "../wrappers/UserWrapper";
import DispatcherWrapper from "../wrappers/DispatcherWrapper";
import DriverWrapper from "../wrappers/DriverWrapper";
const Home = lazy(() => import("../pages/HomePage"));
const NotFound = lazy(() => import("../pages/NotFoundPage"));
const Admin = lazy(() => import("../pages/AdminPages/AdminDashboard"));
const Customer = lazy(() => import("../pages/userPages/CustomerDashboard"));
const Dispatcher = lazy(
  () => import("../pages/dispatcherPages/DispatcherDashboard"),
);
const Driver = lazy(() => import("../pages/driverPages/DriverDashboard"));
const CustomerLayout = lazy(() => import("../layouts/CustomerLayout"));
const AdminLayout = lazy(() => import("../layouts/AdminLayout"));
const DispatcherLayout = lazy(() => import("../layouts/DispatcherLayout"));
const DriverLayout = lazy(() => import("../layouts/DriverLayout"));
const Booking = lazy(() => import("../pages/userPages/BookShipmentPage"));
const Orders = lazy(() => import("../pages/userPages/OrderHistoryPage"));
const Detail = lazy(() => import("../pages/userPages/OrderDetailPage"));
const Tracking = lazy(() => import("../pages/userPages/TrackingPage"));
const Profile = lazy(() => import("../pages/userPages/CustomerProfilePage"));
export const router = createBrowserRouter([
  {
    element: <AppRuntime />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "*", element: <NotFound /> },
        ],
      },
      {
        element: <AdminWrapper />,
        children: [
          {
            element: <AdminLayout />,
            children: [{ path: "admin/dashboard", element: <Admin /> }],
          },
        ],
      },
      {
        element: <UserWrapper />,
        children: [
          {
            element: <CustomerLayout />,
            children: [
              { path: "customer/dashboard", element: <Customer /> },
              { path: "customer/book-shipment", element: <Booking /> },
              { path: "customer/orders", element: <Orders /> },
              { path: "customer/orders/:id", element: <Detail /> },
              { path: "customer/tracking", element: <Tracking /> },
              { path: "customer/profile", element: <Profile /> },
            ],
          },
        ],
      },
      {
        element: <DispatcherWrapper />,
        children: [
          {
            element: <DispatcherLayout />,
            children: [
              { path: "dispatcher/dashboard", element: <Dispatcher /> },
            ],
          },
        ],
      },
      {
        element: <DriverWrapper />,
        children: [
          {
            element: <DriverLayout />,
            children: [{ path: "driver/dashboard", element: <Driver /> }],
          },
        ],
      },
    ],
  },
]);
