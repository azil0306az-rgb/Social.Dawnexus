import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Sparkles, 
  Upload, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Image as ImageIcon, 
  Send, 
  Eye, 
  Check, 
  X,
  AlertCircle,
  FileText
} from 'lucide-react';
import { InstagramIcon as Instagram, FacebookIcon as Facebook, LinkedinIcon as Linkedin } from '../components/common/SocialIcons';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Post, PlatformType, PostStatus, MediaAsset } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const PostsPage: React.FC = () => {
  const { currentWorkspace, user } = useAuth();
  const workspaceId = currentWorkspace?.id || 'ws_dawnexus_prod';

  const [posts, setPosts] = useState<Post[]>(() => dataService.getPosts(workspaceId));
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'pending_approval' | 'scheduled' | 'published'>('all');
  
  // Composer state
  const [caption, setCaption] = useState('');
  const [targetPlatforms, setTargetPlatforms] = useState<PlatformType[]>(['instagram', 'linkedin']);
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [previewPlatform, setPreviewPlatform] = useState<PlatformType>('instagram');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const refreshPosts = async () => {
    const list = await dataService.fetchPosts(workspaceId);
    setPosts(list);
  };

  useEffect(() => {
    refreshPosts();
  }, [workspaceId]);

  const togglePlatform = (p: PlatformType) => {
    setTargetPlatforms(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleAiGenerate = async () => {
    setIsGeneratingAi(true);
    try {
      const result = await dataService.generateAiCaption(aiTopic, previewPlatform);
      setCaption(result.caption + '\n\n' + result.hashtags.join(' '));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleMediaUploadSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // In production this uploads to Supabase/S3 signed storage
    const newMedia: MediaAsset = {
      id: `med_${Date.now()}`,
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      type: 'image',
      name: files[0].name,
      sizeBytes: files[0].size,
      source: 'upload',
    };
    setMediaList(prev => [...prev, newMedia]);
  };

  const handleCreatePost = async (status: PostStatus) => {
    if (!caption.trim()) return;

    await dataService.createPost({
      workspaceId,
      caption,
      media: mediaList,
      targetPlatforms,
      targetAccountIds: [],
      status: currentWorkspace?.requireApprovalForPublishing && status === 'scheduled' ? 'pending_approval' : status,
      scheduledFor: scheduledDate || undefined,
      authorName: user?.fullName || 'User',
    });

    setCaption('');
    setMediaList([]);
    setScheduledDate('');
    await refreshPosts();
    setSaveSuccessNotice(`Post successfully ${status === 'scheduled' ? 'scheduled' : 'saved as draft'}!`);
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  const handleApprove = async (postId: string) => {
    await dataService.updatePostStatus(workspaceId, postId, 'approved', user?.fullName || 'Admin');
    await refreshPosts();
  };

  const handleDelete = async (postId: string) => {
    await dataService.deletePost(workspaceId, postId);
    await refreshPosts();
  };

  const filteredPosts = posts.filter(p => {
    if (activeTab === 'all') return true;
    return p.status === activeTab;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#252525]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-[#C7FF4D] uppercase tracking-wider font-semibold">
              Content Studio
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#252525]" />
            <span className="text-xs text-[#A5A5A5]">Multi-Platform Publishing</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Post Creation & Governance
          </h1>
          <p className="text-sm text-[#A5A5A5] mt-1 max-w-2xl">
            Draft, preview, schedule, and approve posts with official Instagram, Facebook, and LinkedIn container publishing workflows.
          </p>
        </div>

        {saveSuccessNotice && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#C7FF4D]/10 border border-[#C7FF4D]/30 text-xs text-[#C7FF4D] font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccessNotice}</span>
          </div>
        )}
      </div>

      {/* 2-Column Studio Composer & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Post Editor (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#C7FF4D]" />
                <span>Composer</span>
              </h3>
              <span className="text-xs text-[#A5A5A5] font-mono">
                {caption.length} characters
              </span>
            </div>

            {/* Target Channel Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#A5A5A5] uppercase tracking-wider mb-2">
                Publishing Channels
              </label>
              <div className="flex items-center gap-2.5">
                {[
                  { id: 'instagram' as PlatformType, label: 'Instagram', icon: Instagram, color: 'text-pink-400' },
                  { id: 'facebook' as PlatformType, label: 'Facebook', icon: Facebook, color: 'text-blue-400' },
                  { id: 'linkedin' as PlatformType, label: 'LinkedIn', icon: Linkedin, color: 'text-sky-400' },
                ].map((channel) => {
                  const Icon = channel.icon;
                  const isSelected = targetPlatforms.includes(channel.id);
                  return (
                    <button
                      key={channel.id}
                      onClick={() => togglePlatform(channel.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#141414] border-[#C7FF4D]/40 text-white shadow-[0_0_12px_-2px_rgba(199,255,77,0.2)]'
                          : 'bg-[#141414]/50 border-[#252525] text-[#666666] hover:text-[#A5A5A5]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? channel.color : 'text-[#666666]'}`} />
                      <span>{channel.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#C7FF4D]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Assistant Quick Generator */}
            <div className="p-3.5 rounded-xl bg-[#141414] border border-[#252525] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#C7FF4D] flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Caption Generator</span>
                </span>
                <span className="text-[10px] text-[#A5A5A5]">Dawnexus Creative AI</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Announcing new real estate launch in Bangalore..."
                  className="flex-1 bg-[#0B0B0B] border border-[#252525] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#C7FF4D]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isGeneratingAi}
                  onClick={handleAiGenerate}
                  leftIcon={<Sparkles className="w-3 h-3 text-[#C7FF4D]" />}
                >
                  Generate
                </Button>
              </div>
            </div>

            {/* Caption Textarea */}
            <div>
              <label className="block text-xs font-semibold text-[#A5A5A5] uppercase tracking-wider mb-2">
                Post Copy
              </label>
              <textarea
                rows={5}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your post caption, bullet points, call to action, and hashtags..."
                className="w-full bg-[#141414] border border-[#252525] rounded-xl p-3.5 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#C7FF4D] focus:ring-1 focus:ring-[#C7FF4D] transition-colors leading-relaxed"
              />
            </div>

            {/* Media Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-[#A5A5A5] uppercase tracking-wider mb-2">
                Customer Media Assets (Images / Video)
              </label>

              {mediaList.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {mediaList.map((m, idx) => (
                    <div key={m.id} className="relative rounded-xl overflow-hidden border border-[#252525] group aspect-video">
                      <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setMediaList(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 rounded-md bg-black/80 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-[#252525] bg-[#141414]/40 hover:bg-[#141414] hover:border-[#333333] cursor-pointer transition-all">
                <Upload className="w-5 h-5 text-[#C7FF4D] mb-1.5" />
                <span className="text-xs font-medium text-white">Upload authentic photo or video</span>
                <span className="text-[10px] text-[#A5A5A5] mt-0.5">JPEG, PNG, MP4 up to 100MB</span>
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  className="hidden" 
                  onChange={handleMediaUploadSimulate} 
                />
              </label>
            </div>

            {/* Schedule Date & Publishing Controls */}
            <div className="pt-4 border-t border-[#252525] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#A5A5A5]" />
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-[#141414] border border-[#252525] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C7FF4D]"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreatePost('draft')}
                  disabled={!caption.trim()}
                >
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCreatePost(scheduledDate ? 'scheduled' : 'published')}
                  disabled={!caption.trim() || targetPlatforms.length === 0}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  {scheduledDate ? 'Schedule Post' : 'Publish Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Mockup Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#252525] mb-4">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#C7FF4D]" />
                <span>Live Channel Preview</span>
              </span>
              <div className="flex items-center gap-1">
                {(['instagram', 'linkedin', 'facebook'] as PlatformType[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPreviewPlatform(p)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors capitalize ${
                      previewPlatform === p
                        ? 'bg-[#C7FF4D]/15 text-[#C7FF4D] font-bold border border-[#C7FF4D]/30'
                        : 'text-[#A5A5A5] hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Social Mockup Container */}
            <div className="bg-[#050505] border border-[#252525] rounded-xl overflow-hidden shadow-xl text-xs">
              {/* Mockup Header */}
              <div className="p-3 border-b border-[#1C1C1C] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#1C1C1C] border border-[#333333] flex items-center justify-center font-bold text-[10px] text-[#C7FF4D]">
                    DX
                  </div>
                  <div>
                    <p className="font-bold text-white leading-none">
                      {currentWorkspace?.name || 'Dawnexus'}
                    </p>
                    <p className="text-[10px] text-[#A5A5A5]">
                      {previewPlatform === 'instagram' ? '@dawnexus.in' : 'Promoted / Scheduled'}
                    </p>
                  </div>
                </div>
                <Badge variant={previewPlatform} size="sm" />
              </div>

              {/* Mockup Media */}
              {mediaList.length > 0 ? (
                <div className="aspect-square bg-[#141414] overflow-hidden">
                  <img
                    src={mediaList[0].url}
                    alt="Post media"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-[#0E0E0E] flex flex-col items-center justify-center text-[#555555] p-4 text-center">
                  <ImageIcon className="w-8 h-8 mb-1 text-[#333333]" />
                  <span>No media attached</span>
                </div>
              )}

              {/* Mockup Caption */}
              <div className="p-3.5 space-y-2">
                <p className="text-white whitespace-pre-line leading-relaxed text-xs">
                  {caption || <span className="text-[#555555] italic">Your live formatted caption will render here...</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List & Governance Table */}
      <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Post Inventory & History</h3>
            <p className="text-xs text-[#A5A5A5] mt-0.5">Manage drafts, approvals, and published records</p>
          </div>

          {/* Status Tabs Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141414] border border-[#252525]">
            {(['all', 'draft', 'pending_approval', 'scheduled', 'published'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-[#C7FF4D] text-[#050505] font-bold shadow-[0_0_8px_#C7FF4D]'
                    : 'text-[#A5A5A5] hover:text-white'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center text-[#A5A5A5] text-xs">
            No posts found in category "{activeTab}".
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl bg-[#141414] border border-[#252525] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1 overflow-hidden">
                  {post.media.length > 0 ? (
                    <img
                      src={post.media[0].url}
                      alt="Thumbnail"
                      className="w-12 h-12 rounded-lg object-cover border border-[#252525] shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#0B0B0B] border border-[#252525] flex items-center justify-center text-[#A5A5A5] shrink-0">
                      <FileText className="w-5 h-5 text-[#666666]" />
                    </div>
                  )}

                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-white line-clamp-1">{post.caption}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant={post.status} size="sm" />
                      <span className="text-[11px] text-[#A5A5A5]">
                        Author: <strong className="text-white">{post.authorName}</strong>
                      </span>
                      <span className="text-[11px] text-[#666666]">•</span>
                      <span className="text-[11px] text-[#A5A5A5] uppercase font-mono">
                        {post.targetPlatforms.join(' + ')}
                      </span>
                      {post.approverName && (
                        <>
                          <span className="text-[11px] text-[#666666]">•</span>
                          <span className="text-[11px] text-emerald-400">
                            Approved by {post.approverName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {post.status === 'pending_approval' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(post.id)}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Approve
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
