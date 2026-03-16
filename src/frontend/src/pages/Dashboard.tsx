import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QrCode } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { VideoProject } from "../backend";
import { QRModal } from "../components/QRModal";
import { Button } from "../components/ui/button";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface Props {
  onOpenEditor: (id?: string) => void;
}

export function Dashboard({ onOpenEditor }: Props) {
  const { actor } = useActor();
  const { clear, identity } = useInternetIdentity();
  const qc = useQueryClient();
  const [qrOpen, setQrOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery<VideoProject[]>({
    queryKey: ["projects"],
    queryFn: () => actor!.getMyProjects(),
    enabled: !!actor,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => actor!.deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const principal = identity?.getPrincipal().toString();

  return (
    <div
      className="min-h-screen bg-zinc-950 text-white"
      data-ocid="dashboard.page"
    >
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Sarthak</h1>
        <div className="flex gap-2 items-center">
          <Button
            data-ocid="qr.open_modal_button"
            variant="ghost"
            size="icon"
            onClick={() => setQrOpen(true)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="QR Code"
          >
            <QrCode className="w-4 h-4" />
          </Button>

          <Button
            data-ocid="dashboard.new_project_button"
            onClick={() => onOpenEditor()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm"
          >
            + New Project
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-zinc-400"
          >
            Sign out
          </Button>
        </div>
      </div>
      <div className="p-6">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-4">
          My Projects
        </h2>
        {isLoading && (
          <div
            className="text-zinc-500 text-sm"
            data-ocid="dashboard.loading_state"
          >
            Loading projects...
          </div>
        )}
        {!isLoading && projects.length === 0 && (
          <div
            data-ocid="dashboard.empty_state"
            className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl p-16 text-center"
          >
            <div className="text-4xl mb-4">🎬</div>
            <p className="text-zinc-300 font-medium">No projects yet</p>
            <p className="text-zinc-500 text-sm mt-1">
              Create your first reel to get started
            </p>
            <Button
              onClick={() => onOpenEditor()}
              className="mt-4 bg-blue-600 hover:bg-blue-500 text-white"
            >
              Start Editing
            </Button>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {projects.map((p, i) => (
            <motion.button
              type="button"
              key={p.id}
              data-ocid={`project.item.${i + 1}`}
              className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer text-left"
              whileHover={{ scale: 1.03, borderColor: "rgb(37 99 235)" }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  delay: i * 0.06,
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                },
              }}
              onClick={() => onOpenEditor(p.id)}
            >
              <div className="aspect-video bg-zinc-800 flex items-center justify-center">
                <span className="text-3xl">🎞️</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white truncate">
                    {p.title}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(
                      Number(p.updated) / 1_000_000,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid={`project.delete_button.${i + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMut.mutate(p.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 text-xs transition-opacity p-1"
                >
                  ✕
                </button>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <QRModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        userPrincipal={principal}
      />
    </div>
  );
}
