import { redirect } from "next/navigation";

export default function SignUp() {
  // /signup is preserved as a permanent redirect for any old links / bookmarks.
  // The canonical entry point is /apply.
  redirect("/signin#register");
}
