"use client";

import { useState, useEffect } from "react";
import type { Article, ArticleSection } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";
import { Loader2 } from "lucide-react";

const SECTION_OPTIONS: { label: string; value: ArticleSection }[] = [
  { label: "California Transmission News", value: "transmission" },
  { label: "California Energy News", value: "energy" },
  { label: "California Labor News", value: "labor" },
  { label: "Local Coverage", value: "local" },
];

interface EditArticleModalProps {
  article: Article | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditArticleModal({
  article,
  open,
  onOpenChange,
  onSaved,
}: EditArticleModalProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    source: "",
    author: "",
    imageUrl: "",
    section: "transmission" as ArticleSection,
    keywords: "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (article) {
      const kws = Array.isArray(article.keywords)
        ? article.keywords
        : (() => {
            try {
              return JSON.parse(article.keywords as unknown as string);
            } catch {
              return [];
            }
          })();
      setForm({
        title: article.title || "",
        description: article.description || "",
        source: article.source || "",
        author: article.author || "",
        imageUrl: article.imageUrl || "",
        section: article.section,
        keywords: kws.join(", "),
      });
    }
  }, [article]);

  const handleSave = async () => {
    if (!article) return;
    setSaving(true);

    try {
      const keywords = form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await fetch(`/api/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          source: form.source || null,
          author: form.author || null,
          imageUrl: form.imageUrl || null,
          section: form.section,
          keywords,
        }),
      });

      if (!res.ok) throw new Error("Failed to update article");

      toast({
        title: "Article updated",
        variant: "success",
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Update failed",
        description: "Could not save changes.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Article</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="block text-body-sm font-medium text-ink-light mb-1">
              Title
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-ink-light mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-body-sm font-medium text-ink-light mb-1">
                Source
              </label>
              <Input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-ink-light mb-1">
                Author
              </label>
              <Input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-ink-light mb-1">
              Image URL
            </label>
            <Input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-ink-light mb-1">
              Section
            </label>
            <select
              value={form.section}
              onChange={(e) =>
                setForm({
                  ...form,
                  section: e.target.value as ArticleSection,
                })
              }
              className="w-full h-10 rounded-md border border-rule bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
            >
              {SECTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-ink-light mb-1">
              Keywords (comma-separated)
            </label>
            <Input
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="energy, transmission, California"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
