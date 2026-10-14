import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFaculties } from "@/services/library";

export function useFaculties() {
  const query = useQuery({ queryKey: ["faculties", "all"], queryFn: () => fetchFaculties(false) });
  const faculties = useMemo(() => query.data ?? [], [query.data]);
  const facultyName = useMemo(
    () => new Map(faculties.map((faculty) => [faculty.id, faculty.name])),
    [faculties],
  );
  return { facultiesQuery: query, faculties, facultyName };
}
