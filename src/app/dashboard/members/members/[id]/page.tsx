
interface MemberPageProps {
  // make params a Record so it extends Next’s Record<string,string>
  params: Record<string, string> & { id: string };
  // include the optional searchParams slot
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function MemberPage(
  { params, searchParams }: MemberPageProps
) {   // <-- this is the _argument_ type {
  const { id } = params;
  console.log (id);
  return (
    <>
      <div className="flex flex-col gap-y-12 mx-20">
        <div className="flex gap-x-4">
          <h1 className="text-xl font-bold">Member Information</h1>
        </div>
      </div>
    </>
  );
}