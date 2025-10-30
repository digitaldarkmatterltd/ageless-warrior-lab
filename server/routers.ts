import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createContactSubmission } from "./db";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  episodes: router({
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const { getEpisodeBySlug } = await import("./db");
        const episode = await getEpisodeBySlug(input.slug);
        if (!episode) throw new TRPCError({ code: 'NOT_FOUND', message: 'Episode not found' });
        return episode;
      }),

    list: publicProcedure.query(async () => {
      const { getAllEpisodes } = await import("./db");
      return getAllEpisodes();
    }),
    
    getByVideoId: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'string') return val;
        throw new Error('videoId must be a string');
      })
      .query(async ({ input }) => {
        const { getEpisodeByVideoId } = await import("./db");
        return getEpisodeByVideoId(input);
      }),
    
    syncFromYouTube: publicProcedure.mutation(async () => {
      const { fetchYouTubeChannelVideos } = await import("./_core/youtubeSync");
      const { bulkUpsertEpisodes } = await import("./db");
      
      const channelId = "UCRObXaXZjKl6Pnys4f4ILNQ";
      
      // Fetch videos from YouTube RSS feed
      const allVideos = await fetchYouTubeChannelVideos(channelId);
      
      // Save to database
      await bulkUpsertEpisodes(allVideos);
      
      return { success: true, count: allVideos.length };
    }),
    
    generateSummary: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'string') return val;
        throw new Error('videoId must be a string');
      })
      .mutation(async ({ input: videoId }) => {
        const { getEpisodeByVideoId, bulkUpsertEpisodes } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");
        
        const episode = await getEpisodeByVideoId(videoId);
        if (!episode) {
          throw new Error('Episode not found');
        }
        
        // Generate summary using LLM based on title and description
        const prompt = `You are a podcast episode summarizer. Based on the following podcast episode information, write a compelling 2-paragraph summary that captures the key themes and insights discussed.

Episode Title: ${episode.title}

Episode Description: ${episode.description || 'No description available'}

Write a professional, engaging summary in 2 paragraphs that would entice listeners to watch this episode. Focus on the main topics, key insights, and value the episode provides.`;
        
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a professional podcast content writer who creates engaging episode summaries." },
            { role: "user", content: prompt }
          ]
        });
        
        const summary = String(response.choices[0]?.message?.content || '');
        
        // Update episode with summary
        await bulkUpsertEpisodes([{
          videoId: episode.videoId,
          slug: episode.slug,
          title: episode.title,
          description: episode.description,
          publishedTimeText: episode.publishedTimeText,
          lengthSeconds: episode.lengthSeconds,
          views: episode.views,
          thumbnailUrl: episode.thumbnailUrl,
          isLiveNow: episode.isLiveNow,
          summary
        }]);
        
        return { success: true, summary };
      }),
  }),

  contact: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Valid email is required"),
          message: z.string().min(10, "Message must be at least 10 characters"),
        })
      )
      .mutation(async ({ input }) => {
        await createContactSubmission(input);
        
        // Notify owner about new contact form submission
        await notifyOwner({
          title: "New Contact Form Submission",
          content: `From: ${input.name} (${input.email})\n\nMessage:\n${input.message}`,
        });
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
