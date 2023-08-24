import { Input } from "@material-tailwind/react";
// import { Pattern } from "@prisma/client";
import type { ActionArgs, LoaderArgs, NodeOnDiskFile } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { prisma } from "~/db.server";

import { getNoteListItems } from "~/models/note.server";
import { parseMultipartFormData, uploadImages } from "~/models/upload.server";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

export const meta = () => [{ title: "Edit Tags" }];

export const action = async ({ params, request }: ActionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const tid = formData.get("intent") as string;
  await prisma.tag.update({
    where: { id: tid },
    data: {
      category: formData.get("category") as string,
      name: formData.get("name") as string,
    },
  });
  return null;
};

export const loader = async ({ request }: LoaderArgs) => {
  return json({
    tags: await prisma.tag.findMany({
      select: {
        id: true,
        category: true,
        name: true,
        patterns: { select: { id: true } },
      },
    }),
  });
};

export default function TagsPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-blue-gray-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to="." className="px-4">
            Tags
          </Link>
          <Link to="../notes" className="px-4 text-2xl">
            Notes
          </Link>
        </h1>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="rounded bg-slate-600 px-4 py-2 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
          >
            Logout
          </button>
        </Form>
      </header>

      <main className="flex flex-col h-full bg-white overflow-scroll items-baseline">
        {data.tags.map((tag) => (
          <Form key={tag.id} className="m-4 flex" method="POST">
            <div className="w-32">
              {tag.category ? tag.category + ":" + tag.name : tag.name}
            </div>
            <Input
              name="category"
              label="Category"
              containerProps={{ style: { width: 0 }, className: "mr-4" }}
              defaultValue={tag.category}
              crossOrigin={null}
            />
            <Input
              label="Name"
              containerProps={{ style: { width: 0 } }}
              name="name"
              defaultValue={tag.name}
              crossOrigin={null}
            />
            <button name="intent" value={tag.id}>
              Save
            </button>
          </Form>
        ))}
      </main>
    </div>
  );
}
