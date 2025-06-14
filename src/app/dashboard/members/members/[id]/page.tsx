
interface MemberPageProps {
  params: { id: string } & Record<string, string>; // accept any extra keys
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function MemberPage({ params }: MemberPageProps) {
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