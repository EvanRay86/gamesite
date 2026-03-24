import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ date: string }>;
}

export default async function Page({ params }: Props) {
  const { date } = await params;
  redirect(`/daily/linked/archive/${date}`);
}
