import { BookOpen, Dog, Zap } from "lucide-react";
import ModeSelection from "@/components/ModeSelection";
import { WavyUnderline } from "@/components/WavyUnderline";
export default function Home() {
  const questionCount = 613;

  return (
    <main className="min-h-screen bg-white p-2">
      <section className="max-w-2xl mx-auto space-y-4 mb-8 mt-4">
        <h1 className="text-4xl font-bold text-center">
          <WavyUnderline style={0} thickness={6} color="text-lime-400">
            obob.dog{" "}
          </WavyUnderline>
        </h1>
        <p className="text-xl text-center text-muted-foreground">
          Read, practice, and have fun with Oregon Battle of the Books
        </p>
        <div className="flex justify-center space-x-8 pt-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{questionCount}</p>
              <p className="text-sm text-muted-foreground">Questions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">16</p>
              <p className="text-sm text-muted-foreground">Books</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Dog className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Dog</p>
            </div>
          </div>
        </div>
      </section>

      <ModeSelection />
    </main>
  );
}
