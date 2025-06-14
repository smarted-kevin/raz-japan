
export default async function MemberPage({
  params: { id },
}: {
  params: { id:string }
}) {
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