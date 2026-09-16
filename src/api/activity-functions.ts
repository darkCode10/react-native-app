import { supabaseClient } from '../config/supabase';

export interface ActivityItem {
    title: string;
    time: string;
    icon: string;
    iconColor: string;
    iconBg: string;
}

export async function getRecentActivityForClient(clientId: string): Promise<ActivityItem[]> {
    const activities: ActivityItem[] = [];

    try {
        // Fetch milestones
        const { data: milestones, error: milestonesError } = await supabaseClient
            .from('milestones')
            .select('id, title, status, created_at')
            .eq('client', clientId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (milestonesError) throw milestonesError;

        // Process milestones
        if (milestones) {
            for (const milestone of milestones) {
                const date = new Date(milestone.created_at);
                const timeAgo = getTimeAgo(date);

                if (milestone.status === 'LOCKED') {
                    activities.push({
                        title: `Milestone Created: ${milestone.title}`,
                        time: timeAgo,
                        icon: 'lock-closed',
                        iconColor: '#DC2626',
                        iconBg: '#FEE2E2',
                    });
                } else if (milestone.status === 'IN_PROGRESS') {
                    activities.push({
                        title: `Milestone Started: ${milestone.title}`,
                        time: timeAgo,
                        icon: 'play-circle',
                        iconColor: '#D97706',
                        iconBg: '#FEF3C7',
                    });
                } else if (milestone.status === 'SUBMITTED') {
                    activities.push({
                        title: `Work Submitted: ${milestone.title}`,
                        time: timeAgo,
                        icon: 'cloud-upload',
                        iconColor: '#2563EB',
                        iconBg: '#DBEAFE',
                    });
                } else if (milestone.status === 'DONE') {
                    activities.push({
                        title: `Milestone Completed: ${milestone.title}`,
                        time: timeAgo,
                        icon: 'checkmark-circle',
                        iconColor: '#059669',
                        iconBg: '#D1FAE5',
                    });
                }
            }
        }

        // Fetch project invitations (all are pending since accepted ones are deleted)
        const { data: invitations, error: invitationsError } = await supabaseClient
            .from('invitations')
            .select('id, created_at, freelancer(username)')
            .eq('client', clientId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (invitationsError) throw invitationsError;

        if (invitations) {
            for (const invitation of invitations) {
                const date = new Date(invitation.created_at);
                const timeAgo = getTimeAgo(date);

                // All invitations in the table are pending
                activities.push({
                    title: `Invitation sent to ${invitation.freelancer[0]?.username || 'Unknown'}`,
                    time: timeAgo,
                    icon: 'mail',
                    iconColor: '#6366F1',
                    iconBg: '#E0E7FF',
                });
            }
        }

        // Fetch projects
        const { data: projects, error: projectsError } = await supabaseClient
            .from('projects')
            .select('id, title, created_at, status')
            .eq('client', clientId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (projectsError) throw projectsError;

        if (projects) {
            for (const project of projects) {
                const date = new Date(project.created_at);
                const timeAgo = getTimeAgo(date);

                if (project.status === 'ACTIVE') {
                    activities.push({
                        title: `Project Created: ${project.title}`,
                        time: timeAgo,
                        icon: 'add-circle',
                        iconColor: '#10B981',
                        iconBg: '#D1FAE5',
                    });
                } else if (project.status === 'COMPLETED') {
                    activities.push({
                        title: `Project Completed: ${project.title}`,
                        time: timeAgo,
                        icon: 'trophy',
                        iconColor: '#F59E0B',
                        iconBg: '#FEF3C7',
                    });
                }
            }
        }

        // Sort by most recent and return top 5
        activities.sort((a, b) => {
            const timeA = parseTimeAgo(a.time);
            const timeB = parseTimeAgo(b.time);
            return timeA - timeB;
        });

        return activities.slice(0, 5);
    } catch (error) {
        console.error('Error fetching client activity:', error);
        return [];
    }
}

export async function getRecentActivityForFreelancer(freelancerId: string): Promise<ActivityItem[]> {
    const activities: ActivityItem[] = [];

    try {
        // Fetch milestones
        const { data: milestones, error: milestonesError } = await supabaseClient
            .from('milestones')
            .select('id, title, status, created_at')
            .eq('freelancer', freelancerId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (milestonesError) throw milestonesError;

        if (milestones) {
            for (const milestone of milestones) {
                const date = new Date(milestone.created_at);
                const timeAgo = getTimeAgo(date);

                if (milestone.status === 'LOCKED') {
                    activities.push({
                        title: `Milestone Assigned: ${milestone.title}`,
                        time: timeAgo,
                        icon: 'lock-closed',
                        iconColor: '#DC2626',
                        iconBg: '#FEE2E2',
                    });
                } else if (milestone.status === 'IN_PROGRESS') {
                    activities.push({
                        title: `Working on: ${milestone.title}`,
                        time: timeAgo,
                        icon: 'play-circle',
                        iconColor: '#D97706',
                        iconBg: '#FEF3C7',
                    });
                } else if (milestone.status === 'SUBMITTED') {
                    activities.push({
                        title: `Submitted: ${milestone.title}`,
                        time: timeAgo,
                        icon: 'cloud-upload',
                        iconColor: '#2563EB',
                        iconBg: '#DBEAFE',
                    });
                } else if (milestone.status === 'DONE') {
                    activities.push({
                        title: `Milestone Approved: ${milestone.title}`,
                        time: timeAgo,
                        icon: 'checkmark-circle',
                        iconColor: '#0532A9',
                        iconBg: '#DBEAFE',
                    });
                }
            }
        }

        // Fetch invitations (all are pending since accepted ones are deleted)
        const { data: invitations, error: invitationsError } = await supabaseClient
            .from('invitations')
            .select('id, created_at, project(title)')
            .eq('freelancer', freelancerId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (invitationsError) throw invitationsError;

        if (invitations) {
            for (const invitation of invitations) {
                const date = new Date(invitation.created_at);
                const timeAgo = getTimeAgo(date);

                // All invitations in the table are pending
                activities.push({
                    title: `New Invitation: ${invitation.project[0]?.title || 'Unknown Project'}`,
                    time: timeAgo,
                    icon: 'mail',
                    iconColor: '#6366F1',
                    iconBg: '#E0E7FF',
                });
            }
        }

        // Fetch projects joined
        const { data: projectLinks, error: projectLinksError } = await supabaseClient
            .from('project_and_freelancer_link')
            .select('created_at, project(id, title)')
            .eq('freelancer', freelancerId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (projectLinksError) throw projectLinksError;

        if (projectLinks) {
            for (const link of projectLinks) {
                const date = new Date(link.created_at);
                const timeAgo = getTimeAgo(date);

                activities.push({
                    title: `Project Joined: ${link.project[0]?.title || 'Unknown Project'}`,
                    time: timeAgo,
                    icon: 'briefcase',
                    iconColor: '#0532A9',
                    iconBg: '#DBEAFE',
                });
            }
        }

        // Sort by most recent and return top 5
        activities.sort((a, b) => {
            const timeA = parseTimeAgo(a.time);
            const timeB = parseTimeAgo(b.time);
            return timeA - timeB;
        });

        return activities.slice(0, 5);
    } catch (error) {
        console.error('Error fetching freelancer activity:', error);
        return [];
    }
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function parseTimeAgo(timeStr: string): number {
    if (timeStr === 'Just now') return 0;
    
    const match = timeStr.match(/(\d+)([mhd])/);
    if (!match) return 999999;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    if (unit === 'm') return value;
    if (unit === 'h') return value * 60;
    if (unit === 'd') return value * 1440;
    
    return 999999;
}


