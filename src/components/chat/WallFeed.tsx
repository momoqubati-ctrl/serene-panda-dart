"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, Mic, Search, X, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast";

const WallFeed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/wall/posts");
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!postText.trim() || !currentUser) return;

    setIsPosting(true);
    try {
      const res = await fetch("/api/wall/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: currentUser.id,
          text: postText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPostText("");
        showSuccess("تم النشر بنجاح");
        fetchPosts();
      } else {
        showError(data.message);
      }
    } catch (err) {
      showError("حدث خطأ أثناء النشر");
    } finally {
      setIsPosting(false);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-muted ltr">
      <div className="p-1.5 bg-[#2c3e50] flex items-center gap-1.5">
        <div className="flex-1 relative">
          <Input 
            placeholder="Search wall .." 
            className="h-7 bg-card/10 border-none text-white placeholder:text-white/50 pl-7 rounded-md text-[10px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-2 top-2 text-white/50" size={12} />
        </div>
        <button className="bg-red-500 text-white p-1 rounded-md hover:bg-red-600 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {currentUser && (
          <Card className="border-none shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-3">
              <div className="flex gap-2 mb-3">
                <Avatar className="w-9 h-9 rounded-lg">
                  <AvatarImage src={currentUser.avatar || "/pic.png"} />
                  <AvatarFallback>{currentUser.name?.[0]}</AvatarFallback>
                </Avatar>
                <Input 
                  placeholder="بماذا تفكر؟" 
                  className="flex-1 bg-slate-100 border-none h-9 text-[11px] font-medium"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  dir="rtl"
                />
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground gap-1.5 rounded-lg hover:bg-slate-100">
                    <ImageIcon size={16} className="text-green-500" />
                    <span className="text-[10px] font-bold">صورة</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground gap-1.5 rounded-lg hover:bg-slate-100">
                    <Mic size={16} className="text-red-500" />
                    <span className="text-[10px] font-bold">صوت</span>
                  </Button>
                </div>
                <Button 
                  size="sm" 
                  className="h-8 rounded-lg px-4 text-[10px] font-bold"
                  onClick={handleCreatePost}
                  disabled={isPosting || !postText.trim()}
                >
                  {isPosting ? <Loader2 className="animate-spin" size={14} /> : "نشر"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground text-xs font-bold">لا توجد منشورات حالياً</div>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="border-none shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="p-3 flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Avatar className="w-9 h-9 rounded-lg border border-border">
                    <AvatarImage src={post.author?.avatar || "/pic.png"} />
                    <AvatarFallback>{post.author?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div dir="rtl">
                    <h4 className="font-black text-[11px] text-foreground">{post.author?.name}</h4>
                    <p className="text-[9px] text-muted-foreground font-bold">
                      {new Date(post.createdAt).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal size={16} />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-3 pb-2 text-[11px] text-foreground leading-relaxed font-medium" dir="rtl">
                  {post.body}
                </div>
                {post.mediaUrl && (
                  <div className="w-full aspect-video overflow-hidden">
                    <img src={post.mediaUrl} alt="post" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-2 flex items-center justify-between border-t mt-1">
                  <div className="flex gap-3">
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors">
                      <Heart size={16} />
                      <span className="text-[10px] font-bold">0</span>
                    </button>
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                      <MessageCircle size={16} />
                      <span className="text-[10px] font-bold">0</span>
                    </button>
                  </div>
                  <button className="text-muted-foreground hover:text-primary transition-colors">
                    <Share2 size={16} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WallFeed;