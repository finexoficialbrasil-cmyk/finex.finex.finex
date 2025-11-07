
import React, { useState, useEffect } from "react";
import { SystemTutorial } from "@/entities/SystemTutorial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Eye, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import FeatureGuard from "../components/FeatureGuard"; // Added import

const categoryLabels = {
  financas: "Finanças Pessoais",
  investimentos: "Investimentos",
  configuracoes: "Configurações",
  seguranca: "Segurança",
  relatorios: "Relatórios",
  iniciante: "Iniciante",
  avancado: "Avançado",
  integracao: "Integrações"
};

export default function Tutorials() {
  const [tutorials, setTutorials] = useState([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTutorials();
  }, []);

  const loadTutorials = async () => {
    try {
      console.log("🔄 Carregando tutoriais do sistema...");
      const data = await SystemTutorial.list("order");
      console.log("📚 Tutoriais carregados:", data);
      
      // Filtrar apenas tutoriais ativos
      const activeTutorials = data.filter(t => t.is_active);
      console.log("✅ Tutoriais ativos:", activeTutorials.length);
      
      setTutorials(activeTutorials);
    } catch (error) {
      console.error("❌ Erro ao carregar tutoriais:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoClick = async (tutorial) => {
    // Incrementar contador de visualizações
    try {
      await SystemTutorial.update(tutorial.id, {
        ...tutorial,
        views_count: (tutorial.views_count || 0) + 1
      });
      loadTutorials(); // Recarregar para atualizar contadores
    } catch (error) {
      console.error("Erro ao atualizar visualizações:", error);
    }
  };

  const extractYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const filteredTutorials = filterCategory === "all" 
    ? tutorials 
    : tutorials.filter(t => t.category === filterCategory);

  // Agrupar categorias únicas
  const availableCategories = [...new Set(tutorials.map(t => t.category))];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-purple-300">Carregando tutoriais...</div>
      </div>
    );
  }

  return (
    <FeatureGuard pageName="Tutorials">
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text text-transparent flex items-center gap-2">
                <PlayCircle className="w-8 h-8 text-lime-400" />
                Tutoriais em Vídeo
              </h1>
              <p className="text-purple-300 mt-1">Aprenda a usar o BASE44 FINEX</p>
            </div>
          </div>

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <Card className="glass-card border-0 neon-glow">
              <CardContent className="p-4">
                <Tabs value={filterCategory} onValueChange={setFilterCategory}>
                  <TabsList className="bg-purple-900/20 w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    {availableCategories.map(cat => (
                      <TabsTrigger key={cat} value={cat}>
                        {categoryLabels[cat] || cat}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Tutorials Grid */}
          {filteredTutorials.length === 0 ? (
            <Card className="glass-card border-0 neon-glow">
              <CardContent className="p-12 text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-lime-400" />
                <p className="text-purple-300 mb-2">Nenhum tutorial disponível ainda</p>
                <p className="text-sm text-purple-400">
                  Os administradores estão preparando conteúdo para você!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTutorials.map((tutorial, index) => {
                const videoId = extractYoutubeId(tutorial.video_url);
                const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : tutorial.video_url;

                return (
                  <motion.div
                    key={tutorial.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="glass-card border-0 neon-glow hover:scale-105 transition-transform">
                      <CardHeader className="p-0 relative">
                        {tutorial.thumbnail_url ? (
                          <img
                            src={tutorial.thumbnail_url}
                            alt={tutorial.title}
                            className="w-full h-48 object-cover rounded-t-xl"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-lime-900/50 to-green-900/50 rounded-t-xl flex items-center justify-center">
                            <PlayCircle className="w-16 h-16 text-lime-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-black/60 text-white border-0 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {tutorial.views_count || 0}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="mb-3">
                          <Badge className="bg-lime-600/20 text-lime-400 border-lime-600/40 mb-2">
                            {categoryLabels[tutorial.category] || tutorial.category}
                          </Badge>
                          <h3 className="text-white font-semibold text-lg">
                            {tutorial.title}
                          </h3>
                          {tutorial.description && (
                            <p className="text-purple-300 text-sm mt-2 line-clamp-2">
                              {tutorial.description}
                            </p>
                          )}
                        </div>

                        {/* Embedded Video */}
                        <div className="aspect-video rounded-lg overflow-hidden" onClick={() => handleVideoClick(tutorial)}>
                          <iframe
                            src={embedUrl}
                            title={tutorial.title}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Info Card */}
          <Card className="glass-card border-0 border-l-4 border-l-lime-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-lime-400 mt-1" />
                <div>
                  <p className="text-white font-medium">💡 Dica</p>
                  <p className="text-purple-300 text-sm mt-1">
                    Estes tutoriais são criados pelos administradores do sistema para ajudar você a aproveitar ao máximo o BASE44 FINEX!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FeatureGuard>
  );
}
