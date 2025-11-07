import {
    RouterProvider,
    createBrowserRouter,
    createRoutesFromElements,
    Route
} from "react-router";
import { PostingBoard } from "./components/PostingBoard.tsx";

// Import the background image
import NamiBackground from './assets/Nami.png';
import {Birthday} from "./components/Birthday.tsx";

// Create the router
const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/">
            <Route index element={<PostingBoard />} />
            <Route path="postingboard" element={<PostingBoard />} />
            <Route path="birthday" element={<Birthday />} />
        </Route>
    )
);

function App() {
    return (
        <div
            className="w-full min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
            style={{ backgroundImage: `url(${NamiBackground})` }}
        >
            {/* Overlay for readability */} <div className="w-full min-h-screen bg-black/80"> <RouterProvider router={router} /> </div> </div>
    );
}

export default App;
