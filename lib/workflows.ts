/**
 * Available workflow definitions for automation scheduling
 */

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedTime: string;
  recommendedSchedule?: string;
}

export const WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "reply_guy_strategy",
    name: "Reply Guy Strategy",
    description: "Reply to viral threads EARLY to get massive visibility. Targets posts going viral (100-500 likes, <1hr old) from accounts with 10k-500k followers.",
    category: "engagement",
    estimatedTime: "30 min",
    recommendedSchedule: "Every 2 hours (9am, 2pm, 7pm)",
  },
  {
    id: "follower_farming",
    name: "Follower Farming",
    description: "Strategic follow/unfollow tactics to grow your follower base. Targets accounts in your niche with engaged audiences.",
    category: "growth",
    estimatedTime: "45 min",
    recommendedSchedule: "Daily at 9am",
  },
  {
    id: "early_bird_special",
    name: "Early Bird Special",
    description: "Be first to engage with fresh content from influencers. Catch posts within first 5 minutes for maximum visibility.",
    category: "engagement",
    estimatedTime: "20 min",
    recommendedSchedule: "Every hour during peak times",
  },
  {
    id: "reciprocal_engagement",
    name: "Reciprocal Engagement",
    description: "Engage with people who engaged with you. Build relationships through thoughtful replies and likes.",
    category: "relationship",
    estimatedTime: "30 min",
    recommendedSchedule: "Twice daily (morning and evening)",
  },
  {
    id: "learning_workflow",
    name: "Competitor Learning",
    description: "Analyze successful posts from competitors to learn what works. Adapts your strategy based on trending content.",
    category: "learning",
    estimatedTime: "60 min",
    recommendedSchedule: "Weekly on Mondays",
  },
];

/**
 * Get workflow by ID
 */
export function getWorkflowById(id: string): WorkflowDefinition | undefined {
  return WORKFLOWS.find((w) => w.id === id);
}

/**
 * Get workflows by category
 */
export function getWorkflowsByCategory(category: string): WorkflowDefinition[] {
  return WORKFLOWS.filter((w) => w.category === category);
}
