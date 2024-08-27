import { getConfig } from "./getConfig.js";

export default async function getPlan(from, to) {
  const famlyToken = await getConfig().then((c) => c.famly);

  const body = JSON.stringify({
    operationName: "LessonPlans",
    variables: {
      groupIds: null,
      childIds: ["aeb47755-88ed-456b-94f8-8038ac3d5ea4"],
      dateRange: { from, to },
    },
    query: `
      query LessonPlans($groupIds: [GroupId!], $childIds: [ChildId!], $dateRange: ClosedLocalDateRange!) {
        childDevelopment {
          lessonPlans {
            list(groupIds: $groupIds, childIds: $childIds, dateRange: $dateRange) {
              lessonPlans {
                sections {
                  name
                  items {
                    ... on LessonPlanNote {
                      date
                      note
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
  });

  const response = await fetch("https://app.famly.co/graphql?LessonPlans", {
    credentials: "include",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
      Accept: "application/json",
      "content-type": "application/json",
      "x-famly-accesstoken": famlyToken,
    },
    referrer: "https://app.famly.co/",
    body,
    method: "POST",
    mode: "cors",
  });

  console.log("Famly response", response.status);

  const json = await response.json();
  if (!json.data) {
    console.log(json);

    return [];
  }

  const meals = json.data.childDevelopment.lessonPlans.list.lessonPlans
    .flatMap((l) => l.sections)
    .filter((s) => s.name.toLowerCase().includes("måltid"))
    .flatMap((s) => s.items)
    .map(({ date, note }) => {
      let r = /(\d+:\d+):?\s+(.*)/.exec(note);
      if(r){
        const [,time, note] = r;
        return ({
          date: `${date}T${time}:00`,
          note,
        });
      }
      
      r = /(\d) måltid:?\s+(.*)/.exec(note);

      if(r){
        const [,num, note] = r;
        return ({
          date: `${date}T${num === '1' ? '10:30' : '13:30'}:00`,
          note
        })
      }
    });
  console.log(meals);

  return meals;
}

//await getPlan("2024-03-14", "2024-03-16");
