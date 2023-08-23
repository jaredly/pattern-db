import { Input } from "@material-tailwind/react";
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

export const meta = () => [{ title: "Pattern Database" }];

export const action = async ({ params, request }: ActionArgs) => {
  const userId = await requireUserId(request);

  const formData = await parseMultipartFormData(request, uploadImages);

  switch (formData.get("intent")) {
    case "tag:new": {
      const name = formData.get("tag") as string;
      const [one, two] = name.split(":");
      const args = two
        ? { category: one, name: two }
        : { name: one, category: "" };
      await prisma.tag.create({ data: args });
      break;
    }
    case "upload": {
      const image = formData.get("image") as any as NodeOnDiskFile;
      const url = `/uploads/${image.name}`;
      const source = formData.get("source") as string;
      const location = formData.get("location") as string;
      const date = formData.get("date") as string;
      await prisma.pattern.create({
        data: {
          userId,
          images: {
            create: [
              {
                url,
                source,
                location,
                date,
              },
            ],
          },
        },
      });
      break;
    }
  }
  return json({ errors: null }, { status: 200 });
};

export const loader = async ({ request }: LoaderArgs) => {
  return json({
    patterns: await prisma.pattern.findMany({
      select: {
        id: true,
        notes: true,
        images: {
          select: {
            id: true,
            location: true,
            source: true,
            date: true,
            url: true,
          },
        },
        links: {
          select: { id: true, kind: true, url: true },
        },
        tags: {
          select: { id: true, category: true, name: true },
        },
      },
    }),
    // images: await prisma.image.findMany(),
    tags: await prisma.tag.findMany(),
    links: await prisma.link.findMany(),
  });
};

const lsText = (key: string) => {
  const [value, setValue] = useState("");
  useLayoutEffect(() => {
    setValue(window.localStorage[key]);
  }, []);
  return {
    value,
    onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
      setValue((window.localStorage[key] = evt.target.value));
    },
  };
};

export default function NotesPage() {
  const { patterns, tags, links } = useLoaderData<typeof loader>();
  const form = useRef<HTMLFormElement>(null);
  const submit = useSubmit();
  const [check, setCheck] = useState({} as { [key: string]: boolean });
  const [tagSel, setTagSel] = useState([] as string[]);

  useEffect(() => {
    const paste = (evt: ClipboardEvent) => {
      const files = evt.clipboardData?.files;
      if (files?.length === 1) {
        const fd = new FormData(form.current!);
        fd.set("image", files[0]);
        fd.set("intent", "upload");
        submit(fd, { encType: "multipart/form-data", method: "post" });
      }
    };
    document.body.addEventListener("paste", paste);
    return () => document.body.removeEventListener("paste", paste);
  }, []);

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-blue-gray-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">Notes</Link>
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

      <main className="flex flex-col h-full bg-white overflow-scroll">
        <div className="self-stretch sticky top-0 bg-blue-gray-500 text-white mb-4 z-20 p-2 flex items-baseline">
          <Form
            method="post"
            className="flex items-baseline"
            encType="multipart/form-data"
          >
            <Input
              label="New Tag"
              name="tag"
              crossOrigin={null}
              containerProps={{
                style: { flexGrow: 0, width: 0, color: "white" },
                className: "ml-2 mr-2",
              }}
              onKeyDown={(evt) => {
                if (evt.key === "Enter") {
                  const fd = new FormData(evt.currentTarget.form!);
                  fd.set("intent", "tag:new");
                  submit(fd, {
                    encType: "multipart/form-data",
                    method: "post",
                  });
                  evt.currentTarget.value = "";
                  evt.preventDefault();
                }
              }}
              style={{ color: "white" }}
              labelProps={{
                style: {
                  color: "white",
                },
              }}
            />
            <button name="intent" value="tag:new">
              Create Tag
            </button>
          </Form>
          {tags.map((tag) => (
            <button
              key={tag.id}
              className={
                `p-2` + (tagSel.includes(tag.id) ? " bg-blue-gray-400" : "")
              }
              name="tag"
              form="patterns"
              // onClick={() =>
              //   setTagSel((ts) =>
              //     ts.includes(tag.id)
              //       ? ts.filter((t) => t !== tag.id)
              //       : [...ts, tag.id]
              //   )
              // }
            >
              {tag.category}:{tag.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap">
          <Form
            ref={form}
            method="post"
            className="space-y-3 mb-6 w-64 p-4"
            encType="multipart/form-data"
          >
            <input
              type="file"
              name="image"
              onChange={(evt) => {
                const fd = new FormData(evt.target.form!);
                fd.set("intent", "upload");
                submit(fd, {
                  encType: "multipart/form-data",
                  method: "post",
                });
              }}
            />
            <Input
              name="source"
              label="Source (Book, URL, etc.)"
              crossOrigin={undefined}
              {...lsText("pdb:source")}
            />
            <Input
              name="location"
              label="Location"
              crossOrigin={undefined}
              {...lsText("pdb:location")}
            />
            <Input
              name="date"
              label="Date"
              crossOrigin={undefined}
              {...lsText("pdb:date")}
            />
            <button name="intent" value="upload">
              Upload
            </button>
          </Form>
          <style>
            {`
            input[type=checkbox]:checked + div {
                --tw-bg-opacity: 0.8;
                background-color: rgb(207 216 220 / var(--tw-bg-opacity));
            }
            label:hover > input[type=checkbox]:checked + div {
                --tw-bg-opacity: 1;
                background-color: rgb(207 216 220 / var(--tw-bg-opacity));
            }
          `}
          </style>
          <Form
            id="patterns"
            method="post"
            className="contents"
            encType="multipart/form-data"
          >
            {patterns
              .slice()
              .reverse()
              .map((pattern) => (
                <div key={pattern.id}>
                  {pattern.images.map((image) => (
                    <label key={image.id}>
                      <input
                        type="checkbox"
                        name={image.id}
                        className="hidden"
                      />
                      <div
                        onClick={() =>
                          setCheck((c) => ({ ...c, [image.id]: !c[image.id] }))
                        }
                        className="w-64 hover:z-10 hover:bg-blue-gray-50 transition-colors p-8 cursor-pointer"
                      >
                        <Zoomage
                          src={image.url}
                          className="w-64 h-64 object-contain bg-black"
                        />
                        <div className="h-32 relative">
                          <div>{image.date}</div>
                          <div>{image.location}</div>
                          <div>{image.source}</div>
                          <div className="absolute bottom-0 left-0 right-0">
                            {pattern.tags.map((tag) => (
                              <div key={tag.id}>
                                {tag.category}:{tag.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ))}
          </Form>
        </div>
        {/* <div className="h-full w-80 border-r bg-gray-50">
          <hr />
        </div>

        <div className="flex-1 p-6">
          <Outlet />
        </div> */}
      </main>
    </div>
  );
}

const Zoomage = ({ src, className }: { src: string; className?: string }) => {
  const [pos, setPos] = useState(null as null | { x: number; y: number });

  return (
    <img
      onMouseLeave={() => setPos(null)}
      style={{
        objectFit: pos ? "none" : "contain",
        objectPosition: pos
          ? `${(pos.x * 100).toFixed(2)}% ${(pos.y * 100).toFixed(2)}%`
          : undefined,
      }}
      className={className}
      src={src}
      onMouseMove={(evt) => {
        const box = evt.currentTarget.getBoundingClientRect();
        const x = (evt.clientX - box.left) / box.width;
        const y = (evt.clientY - box.top) / box.height;
        setPos({ x, y });
      }}
    />
  );
};
