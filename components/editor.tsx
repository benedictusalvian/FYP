"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import EditorJS from "@editorjs/editorjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { Post } from "@prisma/client"
import { useForm } from "react-hook-form"
import TextareaAutosize from "react-textarea-autosize"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { postPatchSchema } from "@/lib/validations/post"
import { Icons } from "@/components/icons"
import { buttonVariants } from "@/components/ui/button"

interface EditorProps {
  post: Pick<Post, "id" | "title" | "content" | "published">
}

type FormData = z.infer<typeof postPatchSchema>

export function Editor({ post }: EditorProps) {
  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(postPatchSchema),
  })
  const ref = React.useRef<EditorJS>()
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState<boolean>(false)
  const [isMounted, setIsMounted] = React.useState<boolean>(false)
  // const [prompt, setPrompt] = React.useState("")

  const initializeEditor = React.useCallback(async () => {
    const EditorJS = (await import("@editorjs/editorjs")).default
    const Header = (await import("@editorjs/header")).default
    const Embed = (await import("@editorjs/embed")).default
    const Table = (await import("@editorjs/table")).default
    const List = (await import("@editorjs/list")).default
    const Code = (await import("@editorjs/code")).default
    const LinkTool = (await import("@editorjs/link")).default
    const InlineCode = (await import("@editorjs/inline-code")).default

    const body = postPatchSchema.parse(post)

    if (!ref.current) {
      const editor = new EditorJS({
        holder: "editor",
        onReady() {
          ref.current = editor
        },
        placeholder: "Type here to write your journal...",
        inlineToolbar: true,
        data: body.content,
        tools: {
          header: Header,
          linkTool: LinkTool,
          list: List,
          code: Code,
          inlineCode: InlineCode,
          table: Table,
          embed: Embed,
        },
      })
    }
  }, [post])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMounted(true)
    }
  }, [])

  React.useEffect(() => {
    if (isMounted) {
      initializeEditor()

      return () => {
        ref.current?.destroy()
        ref.current = undefined
      }
    }
  }, [isMounted, initializeEditor])

  async function onSubmit(data: FormData) {
    setIsSaving(true)

    const blocks = await ref.current?.save()

    const response = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: data.title,
        content: blocks,
      }),
    })

    setIsSaving(false)

    if (!response?.ok) {
      return toast({
        title: "Something went wrong.",
        description: "Your journal was not saved. Please try again.",
        variant: "destructive",
      })
    }

    router.refresh()

    return toast({
      description: "Your journal has been saved.",
    })
  }

  // const submitPrompt = async () => {

  //   // Get data from the form.
  //   const data = {
  //     "prompt": prompt,
  //     "num_samples": 1,
  //     "num_top_matches": 1,
  //     "duration": 30
  //   }

  //   // Send the data to the server in JSON format.
  //   const JSONdata = JSON.stringify(data)

  //   // API endpoint where we send form data.
  //   const endpoint = 'http://d-app-clgjbq5mt003o2y2ngkxhwkge-947411825.us-east-1.elb.amazonaws.com'

  //   // Form the request for sending data to the server.
  //   const options = {
  //     // The method is POST because we are sending data.
  //     method: 'POST',
  //     // Tell the server we're sending JSON.
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     // Body of the request is the JSON data we created above.
  //     body: JSONdata,
  //   }

  //   // Send the form data to our forms API on Vercel and get a response.
  //   const response = await fetch(endpoint, options)

  //   // Get the response data from server as JSON.
  //   // If server returns the name submitted, that means the form works.
  //   const result = await response.json()
  //   console.log(result.data)


  // }

  if (!isMounted) {
    return null
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid w-full gap-10">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center space-x-10">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              <>
                <Icons.chevronLeft className="mr-2 h-4 w-4" />
                Back
              </>
            </Link>
            <p className="text-sm text-slate-600">
              {post.published ? "Published" : "Draft"}
            </p>
          </div>
          <button type="submit" className={cn(buttonVariants())}>
            {isSaving && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            <span>Save</span>
          </button>
        </div>
        <div className="prose prose-stone mx-auto w-[800px]">
          <TextareaAutosize
            autoFocus
            id="title"
            defaultValue={post.title}

            placeholder="Journal title"
            className="w-full resize-none appearance-none overflow-hidden text-5xl font-bold focus:outline-none"
            {...register("title")}
          />
          <div id="editor" className="min-h-[500px]" />
            {/* <label htmlFor="prompt">Prompt to generate:</label>
            <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}/>
            <button onSubmit={submitPrompt}>Submit</button> */}
          <p className="text-sm text-gray-500">
            Use{" "}
            <kbd className="rounded-md border bg-slate-50 px-1 text-xs uppercase">
              Tab
            </kbd>{" "}
            to open the command menu.
          </p>
        </div>
      </div>
    </form>
  )
}
