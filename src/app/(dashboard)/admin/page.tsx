"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Users,
  Server,
  Search,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");

  const isAdmin = session?.user?.role === "admin";

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
    enabled: isAdmin,
  });

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ["admin-queue"],
    queryFn: async () => {
      const res = await fetch("/api/admin/queue");
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
    enabled: isAdmin,
    refetchInterval: 10000,
  });

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium">Admin Access Required</h2>
        <p className="text-muted-foreground mt-1">
          You don&apos;t have permission to access this page
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage users and monitor system health
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Queue Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(queueData?.queues ?? []).map((queue: any) => (
                <div
                  key={queue.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{queue.name}</span>
                  </div>
                  {queue.error ? (
                    <Badge variant="destructive">Unavailable</Badge>
                  ) : (
                    <div className="flex gap-2">
                      {queue.active > 0 && (
                        <Badge variant="default">{queue.active} active</Badge>
                      )}
                      {queue.waiting > 0 && (
                        <Badge variant="secondary">
                          {queue.waiting} waiting
                        </Badge>
                      )}
                      {queue.delayed > 0 && (
                        <Badge variant="outline">
                          {queue.delayed} delayed
                        </Badge>
                      )}
                      {queue.failed > 0 && (
                        <Badge variant="destructive">
                          {queue.failed} failed
                        </Badge>
                      )}
                      {queue.completed > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {queue.completed} done
                        </span>
                      )}
                      {!queue.active &&
                        !queue.waiting &&
                        !queue.delayed &&
                        !queue.failed && (
                          <span className="text-xs text-muted-foreground">
                            Idle
                          </span>
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({usersData?.pagination?.total ?? 0})
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(usersData?.users ?? []).map((user: any) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name ?? "No name"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <Badge variant="secondary">{user.plan ?? "none"}</Badge>
                  <div className="text-xs text-muted-foreground text-right">
                    <p>{user.usage?.clipsGenerated ?? 0} clips</p>
                    <p>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
