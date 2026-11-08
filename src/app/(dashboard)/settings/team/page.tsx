"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Users,
  Plus,
  Loader2,
  Mail,
  Shield,
  Crown,
} from "lucide-react";
import Link from "next/link";

const ROLE_ICONS: Record<string, any> = {
  owner: Crown,
  admin: Shield,
  member: Users,
};

export default function TeamSettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  const { data: teamData, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/teams");
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
  });

  const { data: invitationsData } = useQuery({
    queryKey: ["team-invitations"],
    queryFn: async () => {
      const res = await fetch("/api/teams/invitations");
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
    enabled: !!teamData?.team,
  });

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      setTeamName("");
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/teams/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      setInviteEmail("");
      setInviteOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const team = teamData?.team;
  const invitations = invitationsData?.invitations ?? [];
  const isPro = session?.user?.plan === "pro";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Settings
        </Link>
        <h1 className="text-2xl font-bold">Team</h1>
      </div>

      {!isPro ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-medium">Teams require Pro</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Upgrade to Pro to create a team and collaborate with others
            </p>
            <Button asChild>
              <Link href="/settings/billing">Upgrade to Pro</Link>
            </Button>
          </CardContent>
        </Card>
      ) : !team ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-medium">Create Your Team</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Collaborate with your team on video projects
            </p>
            <div className="flex gap-2 w-full max-w-sm">
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
              />
              <Button
                onClick={() => createTeamMutation.mutate()}
                disabled={!teamName || createTeamMutation.isPending}
              >
                {createTeamMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Members ({team.members?.length ?? 0})</CardTitle>
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger className="inline-flex items-center justify-center h-7 gap-1 px-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors">
                    <Plus className="h-4 w-4" />
                    Invite
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="mt-1"
                        placeholder="colleague@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v ?? "member")}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={() => inviteMutation.mutate()}
                      disabled={!inviteEmail || inviteMutation.isPending}
                      className="w-full"
                    >
                      {inviteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Send Invitation
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(team.members ?? []).map((member: any) => {
                  const RoleIcon = ROLE_ICONS[member.role] ?? Users;
                  return (
                    <div
                      key={member.userId}
                      className="flex items-center gap-3 p-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <RoleIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {member.userId === session?.user?.id
                            ? "You"
                            : member.userId}
                        </p>
                      </div>
                      <Badge variant="secondary">{member.role}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {invitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invitations.map((inv: any) => (
                    <div
                      key={inv._id}
                      className="flex items-center justify-between p-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Expires{" "}
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{inv.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
