#!/usr/bin/env node
import { FastMCP } from 'fastmcp';
import { z } from 'zod';

const OPENVERSE_API_BASE = 'https://api.openverse.org/v1';
const DEFAULT_PAGE_SIZE = 20;

// Create the MCP server
const server = new FastMCP({
  name: 'openverse-images',
  version: '0.1.0'
});

// Schema definitions
const searchImagesSchema = z.object({
  query: z.string().describe('Search terms (required)'),
  page: z.number().optional().describe('Page number (default: 1)'),
  page_size: z.number().optional().describe('Results per page (default: 20, max: 500)'),
  license: z.string().optional().describe('License filter (e.g., by, by-sa, cc0)'),
  license_type: z.string().optional().describe('License type (commercial or modification)'),
  creator: z.string().optional().describe('Filter by creator name'),
  source: z.string().optional().describe('Filter by source (e.g., flickr, wikimedia)'),
  extension: z.string().optional().describe('File type (jpg, png, gif, svg)'),
  aspect_ratio: z.string().optional().describe('Image shape (tall, wide, square)'),
  size: z.string().optional().describe('Image size (small, medium, large)'),
  mature: z.boolean().optional().describe('Include mature content (default: false)')
});

const imageDetailsSchema = z.object({
  image_id: z.string().describe('Openverse image ID (UUID format)')
});

const relatedImagesSchema = z.object({
  image_id: z.string().describe('Openverse image ID'),
  page: z.number().optional().describe('Page number (default: 1)'),
  page_size: z.number().optional().describe('Results per page (default: 10)')
});

const essayImagesSchema = z.object({
  essay_topic: z.string().describe('Main topic/title of the essay'),
  concepts: z.array(z.string()).describe('List of key concepts to find images for'),
  style: z.enum(['photo', 'illustration', 'any']).optional().describe('Preferred image style (default: any)'),
  max_images: z.number().optional().describe('Maximum images to return (default: 10)')
});

// Tool: search_images
server.addTool({
  name: 'search_images',
  description: 'Search for openly-licensed images on Openverse',
  parameters: searchImagesSchema,
  execute: async (args) => {
    const params: Record<string, string> = {
      q: args.query,
      page: String(args.page || 1),
      page_size: String(Math.min(args.page_size || DEFAULT_PAGE_SIZE, 500)),
      mature: String(args.mature || false)
    };

    // Add optional parameters
    if (args.license) params.license = args.license;
    if (args.license_type) params.license_type = args.license_type;
    if (args.creator) params.creator = args.creator;
    if (args.source) params.source = args.source;
    if (args.extension) params.extension = args.extension;
    if (args.aspect_ratio) params.aspect_ratio = args.aspect_ratio;
    if (args.size) params.size = args.size;

    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${OPENVERSE_API_BASE}/images/?${queryParams}`, {
        headers: {
          'User-Agent': 'MCP-Openverse/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// Tool: get_image_details
server.addTool({
  name: 'get_image_details',
  description: 'Get detailed information about a specific image',
  parameters: imageDetailsSchema,
  execute: async (args) => {
    try {
      const response = await fetch(`${OPENVERSE_API_BASE}/images/${args.image_id}/`, {
        headers: {
          'User-Agent': 'MCP-Openverse/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image details: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// Tool: get_related_images
server.addTool({
  name: 'get_related_images',
  description: 'Get images related to a specific image',
  parameters: relatedImagesSchema,
  execute: async (args) => {
    const params = new URLSearchParams({
      page: String(args.page || 1),
      page_size: String(args.page_size || 10)
    });

    try {
      const response = await fetch(
        `${OPENVERSE_API_BASE}/images/${args.image_id}/related/?${params}`,
        {
          headers: {
            'User-Agent': 'MCP-Openverse/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch related images: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// Tool: get_image_stats
server.addTool({
  name: 'get_image_stats',
  description: 'Get statistics about image providers and counts',
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await fetch(`${OPENVERSE_API_BASE}/images/stats/`, {
        headers: {
          'User-Agent': 'MCP-Openverse/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// Tool: search_images_for_essay
server.addTool({
  name: 'search_images_for_essay',
  description: 'Search for images suitable for illustrating an essay',
  parameters: essayImagesSchema,
  execute: async (args) => {
    const {
      essay_topic,
      concepts = [],
      style = 'any',
      max_images = 10
    } = args;

    const results = {
      topic: essay_topic,
      images_by_concept: {} as Record<string, any[]>,
      featured_images: [] as any[],
      total_images: 0
    };

    // Helper function to search images
    const searchImages = async (query: string, pageSize: number, filters: Record<string, string> = {}): Promise<{results: any[]}> => {
      const params: Record<string, string> = {
        q: query,
        page_size: String(pageSize),
        mature: 'false',
        ...filters
      };

      if (style === 'photo') {
        params.extension = 'jpg,png';
      }

      const queryParams = new URLSearchParams(params);

      try {
        const response = await fetch(`${OPENVERSE_API_BASE}/images/?${queryParams}`, {
          headers: {
            'User-Agent': 'MCP-Openverse/1.0'
          }
        });

        if (!response.ok) {
          return { results: [] };
        }

        return await response.json() as {results: any[]};
      } catch {
        return { results: [] };
      }
    };

    try {
      // Search for main topic
      const mainSearch = await searchImages(essay_topic, Math.min(5, max_images));
      
      if (mainSearch.results) {
        results.featured_images = mainSearch.results.slice(0, 3).map((img: any) => ({
          id: img.id,
          title: img.title || '',
          url: img.url,
          thumbnail: img.thumbnail || '',
          creator: img.creator || 'Unknown',
          license: img.license || '',
          attribution: img.attribution || '',
          source: img.source || ''
        }));
        results.total_images += results.featured_images.length;
      }

      // Search for each concept
      const imagesPerConcept = concepts.length ? Math.max(1, Math.floor(max_images / concepts.length)) : max_images;
      
      for (const concept of concepts) {
        if (results.total_images >= max_images) break;

        const conceptSearch = await searchImages(
          `${concept} ${essay_topic}`,
          imagesPerConcept
        );

        if (conceptSearch.results && conceptSearch.results.length > 0) {
          results.images_by_concept[concept] = conceptSearch.results
            .slice(0, imagesPerConcept)
            .map((img: any) => ({
              id: img.id,
              title: img.title || '',
              url: img.url,
              thumbnail: img.thumbnail || '',
              creator: img.creator || 'Unknown',
              license: img.license || '',
              attribution: img.attribution || '',
              source: img.source || ''
            }));
          results.total_images += results.images_by_concept[concept].length;
        }
      }

      return JSON.stringify(results, null, 2);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to search for essay images',
        topic: essay_topic
      });
    }
  }
});

// Start the server
server.start({
  transportType: 'stdio'
}).catch(console.error);