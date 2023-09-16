import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import invariant from "tiny-invariant";
// import { App, initialState } from "geometricart";

export default function NoteDetailsPage() {
  return (
    <div>
      Hello stuff
      {/* <App lastSaved={null} saveState={() => {}} initialState={initialState} /> */}
    </div>
  );
}
