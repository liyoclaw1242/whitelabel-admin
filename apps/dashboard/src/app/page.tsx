import { Button } from "@whitelabel/ui";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Whitelabel Admin</h1>
      <Button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Get Started
      </Button>
    </main>
  );
}
