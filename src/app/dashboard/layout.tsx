export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {

  // const token = await getToken();
  // const user = await fetchQuery(api.auth.getCurrentUser, {}, {token});


  // if (user && user.role == "user") { 
  //   const userTableUser = await fetchQuery(api.queries.users.getUserRoleByAuthId, {userId: user._id});
  //   return redirect("/dashboard/members");
  // }

  // if (user && (user.role == "admin" || user.role == "god")) { 
  //   return redirect('/dashboard/admin');
  // }

  return (
    children
  )
}