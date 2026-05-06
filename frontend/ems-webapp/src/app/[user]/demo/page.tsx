import createClient  from "@/utils/supabase/server";
import { Suspense } from "react";

async function InstrumentsData() {
  const supabase = await createClient();
  const { data: instruments } = await supabase.from("BUILDING").select();

  return <pre  className="flex text-black ">{JSON.stringify(instruments, null, 2)}</pre>;
}

export default function Instruments() {
  return (
    <Suspense fallback={<div  className="flex text-black ">Loading instruments...</div>}>
      <InstrumentsData />
    </Suspense>
  );
}