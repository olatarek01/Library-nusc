<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

Student avatars live in a private `student-photos` Storage bucket at `<auth user id>/avatar`, with owner-only storage policies and temporary signed URLs; this avoids exposing students' photos publicly or changing existing student records.

Public-facing library pages share the `library-public` background and `public-glass-card` treatment in the global stylesheet; keeping them scoped there prevents the theme from affecting internal dashboards.

The site uses a single light off-white/navy theme driven by semantic CSS tokens; this keeps public and internal pages visually consistent without a dark-mode branch.

Responsive layouts use shrinkable grid/flex tracks, locally scrollable tables, and viewport-bounded dialogs and navigation; this keeps content reachable on narrow and short screens without hiding page overflow.
