import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Filter
} from 'lucide-react';
import { InstagramIcon as Instagram, FacebookIcon as Facebook, LinkedinIcon as Linkedin } from '../components/common/SocialIcons';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Post, PlatformType } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

interface CalendarPageProps {
  onNavigateToComposer?: () => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ onNavigateToComposer }) => {
  const { currentWorkspace } = useAuth();
  const workspaceId = currentWorkspace?.id || 'ws_dawnexus_prod';

  const [posts, setPosts] = useState<Post[]>(() => dataService.getPosts(workspaceId));
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date(2026, 9, 1)); // October 2026
  const [filterPlatform, setFilterPlatform] = useState<PlatformType | 'all'>('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    async function loadPosts() {
      const psts = await dataService.fetchPosts(workspaceId);
      setPosts(psts);
    }
    loadPosts();
  }, [workspaceId]);

  // Generate 35 days for a 5-week calendar view
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth(); // 0-indexed
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push({ dayNumber: null, isCurrentMonth: false, dateStr: '' });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const formattedMonth = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    calendarDays.push({ dayNumber: day, isCurrentMonth: true, dateStr });
  }

  const prevMonth = () => {
    setSelectedMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(year, month + 1, 1));
  };

  const getPostsForDate = (dateStr: string) => {
    return posts.filter(p => {
      const targetDate = p.scheduledFor ? p.scheduledFor.substring(0, 10) : p.publishedAt ? p.publishedAt.substring(0, 10) : null;
      if (!targetDate || targetDate !== dateStr) return false;
      if (filterPlatform !== 'all' && !p.targetPlatforms.includes(filterPlatform)) return false;
      return true;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#252525]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-[#C7FF4D] uppercase tracking-wider font-semibold">
              Content Pipeline
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#252525]" />
            <span className="text-xs text-[#A5A5A5]">30-Day Publishing View</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Schedule & Queue Calendar
          </h1>
          <p className="text-sm text-[#A5A5A5] mt-1 max-w-2xl">
            Visual overview of scheduled campaigns, planned social drops, and publishing cadence across your connected networks.
          </p>
        </div>

        {/* Filter & Month Navigation */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-[#141414] border border-[#252525] rounded-xl p-1">
            <button
              onClick={() => setFilterPlatform('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filterPlatform === 'all' ? 'bg-[#C7FF4D] text-[#050505] font-bold' : 'text-[#A5A5A5]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterPlatform('instagram')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filterPlatform === 'instagram' ? 'bg-pink-500/20 text-pink-400 font-bold border border-pink-500/30' : 'text-[#A5A5A5]'
              }`}
            >
              IG
            </button>
            <button
              onClick={() => setFilterPlatform('facebook')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filterPlatform === 'facebook' ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-600/30' : 'text-[#A5A5A5]'
              }`}
            >
              FB
            </button>
            <button
              onClick={() => setFilterPlatform('linkedin')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filterPlatform === 'linkedin' ? 'bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30' : 'text-[#A5A5A5]'
              }`}
            >
              LI
            </button>
          </div>

          <div className="flex items-center gap-2 bg-[#0B0B0B] border border-[#252525] rounded-xl px-3 py-1.5">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg text-[#A5A5A5] hover:text-white hover:bg-[#141414]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white font-mono px-2">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg text-[#A5A5A5] hover:text-white hover:bg-[#141414]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#0B0B0B] border border-[#252525] rounded-2xl overflow-hidden shadow-2xl">
        {/* Day Header Row */}
        <div className="grid grid-cols-7 border-b border-[#252525] bg-[#141414]/60 text-center py-2.5 text-xs font-semibold text-[#A5A5A5] uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#252525]">
          {calendarDays.map((calDay, idx) => {
            if (!calDay.isCurrentMonth) {
              return (
                <div key={idx} className="min-h-[110px] bg-[#070707]/60 p-2 text-[#444444]" />
              );
            }

            const dayPosts = getPostsForDate(calDay.dateStr);
            const isToday = calDay.dateStr === '2026-10-20'; // Current simulation date

            return (
              <div 
                key={idx} 
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors hover:bg-[#121212] ${
                  isToday ? 'bg-[#C7FF4D]/5' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-semibold ${
                    isToday ? 'px-1.5 py-0.5 rounded bg-[#C7FF4D] text-[#050505] font-bold shadow-[0_0_8px_#C7FF4D]' : 'text-[#A5A5A5]'
                  }`}>
                    {calDay.dayNumber}
                  </span>
                  {dayPosts.length > 0 && (
                    <span className="text-[10px] text-[#A5A5A5] font-mono">
                      {dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Post Chips */}
                <div className="space-y-1 my-1">
                  {dayPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="w-full text-left p-1.5 rounded-lg bg-[#141414] border border-[#252525] hover:border-[#C7FF4D]/40 transition-all text-[11px] truncate block group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          post.status === 'published' ? 'bg-[#C7FF4D]' : 'bg-cyan-400'
                        }`} />
                        <span className="text-white truncate font-medium group-hover:text-[#C7FF4D]">
                          {post.caption}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div />
              </div>
            );
          })}
        </div>
      </div>

      {/* Post Detail Drawer / Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-[#A5A5A5] font-mono">Post Inspection</span>
                <h3 className="text-base font-bold text-white mt-0.5">Scheduled Publication</h3>
              </div>
              <Badge variant={selectedPost.status} size="sm" />
            </div>

            {selectedPost.media.length > 0 && (
              <img
                src={selectedPost.media[0].url}
                alt="Media"
                className="w-full h-44 rounded-xl object-cover border border-[#252525]"
              />
            )}

            <p className="text-xs text-white leading-relaxed whitespace-pre-line p-3 rounded-xl bg-[#141414] border border-[#252525]">
              {selectedPost.caption}
            </p>

            <div className="text-xs text-[#A5A5A5] space-y-1.5 pt-2 border-t border-[#252525]">
              <div className="flex justify-between">
                <span>Platforms:</span>
                <span className="text-white uppercase font-mono">{selectedPost.targetPlatforms.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Scheduled Time:</span>
                <span className="text-white font-mono">{new Date(selectedPost.scheduledFor || selectedPost.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Author:</span>
                <span className="text-white">{selectedPost.authorName}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setSelectedPost(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
