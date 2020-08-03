# 구글 캘린더를 활용한 봇 만들기

구글 캘린더를 활용한 봇 만드는 방법을 설명합니다. 아래 블로그를 참고해 만들었습니다.

> [Mattermost에서 Google Calendar 일정 받기 (Serverless)](https://grip.news/archives/1272)

## 만든 이유

[토스팀의 인터널 사일로의 인터뷰](https://blog.toss.im/2020/07/22/tossteam/people/toss-internalsilo-interview/) 중 인터널 사일로에서 토스팀 팀원들을 위해 다양한 봇들을 만드는 걸 보고 영감을 얻었습니다.

현재 R&D 센터도 구글 캘린더를 활용해 팀의 일정, 휴가 등을 관리하고 있는데, 이 구글 캘린더의 정보를 한 곳에 모아보면 좋지 않을까 라는 생각이 들었습니다. 그래서 구글 캘린더의 이벤트들을 매일 오전에 받을 수 있도록 팀원들을 위한 봇을 만들게 되었습니다.

## 시작하기

**NOTE:**

```
메타모스트의 시스템 관리자인 경우에만 가능하며, 관리자 도구에서 Incoming Webhook이 활성화되어 있어야 합니다.
```

1. **관리자 도구 > 통합관리**
2. **Incoming Webhook 활성화**
3. 저장

### Step1. 메타모스트 웹훅 URL 생성

우선 웹훅은 웹 서비스를 제공해주는 서버에서 어떤 이벤트가 발생했을 때 사용자의 서버로 알림을 보내주는 기능입니다. 구글 캘린더의 정보를 메타모스트 메시지로 받기 위해서는 먼저 웹훅 URL을 생성해야 합니다.

1. 좌측 사용자 프로필 옆 **햄버거 버튼** 클릭
2. 통합 > 전체 Incoming Webhook > Incoming Webhook 추가하기
3. 폼을 입력한 뒤 저장

저장하고 나면 방금 만든 웹훅의 URL을 알 수 있습니다. 해당 URL을 이용해 웹훅 추가 시 선택한 채널로 메시지를 보내게 됩니다.

**NOTE:**

```
웹훅의 URL은 외부로 유출되어서는 안됩니다.
```

### Step2. 구글 앱스 스크립트 작성

구글에서 제공하는 구글 앱스 스크립트를 활용해 구글 캘린더에서 발생하는 이벤트를 수신하고, Step 1에서 생성한 웹훅 URL로 보내는 스크립트를 작성합니다.

구글 앱스 스크립트(Google Apps Script: GAS)는 구글 문서도구에서 문서를 자동화하고 여러 구글 앱과 연결해 작업할 수 있는 도구입니다.

자바스크립트를 사용해 작성할 수 있으므로 굉장히 편리하고, 최근 버전에서는 ES6의 일부 문법도 지원된다고 합니다. 여기서는 구글 스프레트시트를 이용해 작성하였습니다.

1. 구글 스프레드 시트 생성
2. 상단 메뉴바 **도구 > 스크립트 편집기** 클릭

![MmGoogleCalendar-1](https://user-images.githubusercontent.com/11264094/89146409-992a9b00-d58e-11ea-83f7-2b9d16d8dab6.png)

### Step3. 구글 캘린더 정보 가져오기

스크립트를 작성하기 전에 정보를 가져올 구글 캘린더의 아이디를 알아야 합니다.

1. 구글 캘린더 접속
2. 우측 상단 **설정 메뉴 > 설정 > 내 캘린더의 설정에서 가져올 구글 캘린더 이름** 클릭
3. **캘린더 통합** 클릭
4. 캘린더 ID 복사

![MmGoogleCalendar-2](https://user-images.githubusercontent.com/11264094/89146578-2837b300-d58f-11ea-9748-1ab38565213d.png)

### Step4. 스크립트 작성하기

오늘의 일정과 휴가 그리고 생일 이벤트를 가져오는 스크립트를 작성합니다. 스크립트의 기본 뼈대는 [위에서 언급한 블로그](https://grip.news/archives/1272)를 그리고 [구글 앱스 스크립트에서 제공하는 구글 캘린더 API 문서](https://developers.google.com/apps-script/reference/calendar) 를 보고 작성하였습니다.

참고로 해당 블로그에서는 `text` 파라미터를 활용해 메시지를 작성한 반면, 저는 `attachments`를 사용하였습니다.

#### 메시지를 보내는 API 호출

[위에서 언급한 블로그](https://grip.news/archives/1272) 코드를 활용하였습니다.

```javascript
/**
 * 메세지를 보낼 때 사용하는 함수로 POST 형식으로 보냅니다.
 * @params msgBody 보낼 메시지 (해당 소스코드에서는 사용하지 않습니다.)
 * @params iconUrl 봇 프로필 사진용 아이콘 URL
 * @params userName 봇 프로필 이름
 * @params attachments 메시지 attachments
 */
function postMmost(msgBody, iconUrl, userName, attachments = []) {
  let payload = {
    text: msgBody,
    // iconUrl 이 없는 경우 구글 캘린더 아이콘을 사용합니다.
    icon_url: iconUrl || "https://img.icons8.com/color/420/google-calendar.png",
    // userName이 없는 경우 기본 이름(TODAY EVENTS)을 사용합니다.
    username: userName || "TODAY EVENTS",
    attachments: attachments,
  };

  // REST API Options
  let options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload),
  };

  let response = UrlFetchApp.fetch(webhookUrl, options);
  let content = response.getContentText("UTF-8");
}
```

#### 오늘의 일정

휴가와 생일을 제외한 이벤트들을 가져옵니다. 가져온 이벤트들의 시작 및 종료시간의 시간형식을 변경해 메시지로 만들어줍니다.

```javascript
function todayEvents(calendarId) {
  let calendar = CalendarApp.getCalendarById(calendarId);
  let today = new Date();
  let todayText = Utilities.formatDate(today, "GMT+0900", "YYYY년 MM월 dd일");
  let events = calendar.getEventsForDay(today);

  let icon = "https://img.icons8.com/color/420/iron-man.png";
  let text = "#### 안녕? :wave: 좋은 아침이에요! ";
  let msg = "";

  // 이벤트가 없을 때
  if (events.length < 1) {
    text += "오늘은 특별한 일정이 없네요 :slightly_smiling_face:";
  } else {
    text += "오늘의 일정을 간략하게 알려드릴게요.";
    msg = "| 시간 | 제목 | 회의실 |\n|:------|:-------| :----------|\n";

    for (let i = 0; i < events.length; i++) {
      // 이벤트 시작 시간
      let startTime = Utilities.formatDate(
        events[i].getStartTime(),
        "GMT+0900",
        "HH시 mm분"
      );
      // 이벤트 종료 시간
      let endTime = Utilities.formatDate(
        events[i].getEndTime(),
        "GMT+0900",
        "HH시 mm분"
      );
      let location = events[i].getLocation(); // 이벤트 회의실 정보
      let title = events[i].getTitle(); // 이벤트 제목

      // 휴가와 생일을 제외한 나머지 이벤트들만 가져옵니다.
      if (
        title.indexOf("휴가") === -1 &&
        title.indexOf("오전반차") === -1 &&
        title.indexOf("오후반차") === -1 &&
        title.indexOf("생일") === -1
      ) {
        msg += `|${startTime} ~ ${endTime}|${title}|${location}|\n`;
      }
    }
  }

  let attachments = [
    {
      color: "#cc101f",
      text: text,
      fields: [
        {
          short: true,
          // 이벤트가 있을 경우 오늘 날짜를 타이틀로 보여줍니다.
          title: events.length < 1 ? "" : todayText,
          value: msg, // 이벤트 정보
        },
      ],
      // attachments 의 footer 정보
      footer: "전 좀 쉬어야겠어요. 그럼 이만!",
      footer_icon: "https://img.icons8.com/color/420/cocktail.png",
    },
  ];

  // API 호출
  postMmost("", icon, "J.A.R.V.I.S.", attachments);
}
```

- 일정이 없을 때
  ![MmGoogleCalendar-3](https://user-images.githubusercontent.com/11264094/89146997-6c778300-d590-11ea-9d26-c8552cc56871.png)

- 일정이 있을 때
  ![MmGoogleCalendar-4](https://user-images.githubusercontent.com/11264094/89147200-f58eba00-d590-11ea-8bf9-dbe4b0d8f35a.png)

#### 오늘의 휴가

현재 R&D 센터는 캘린더에 휴가 등록 시 제목에 `오전반차`, `오후반차`, `휴가`를 입력합니다. 구글에서 제공하는 `getEventsForDay(date, options)` API의 `search` 파라미터를 활용해 해당 키워드로 필터링한 결과를 가져옵니다.

**참고로 `search` 파라미터는 단어 단위로만 검색할 수 있습니다.**

> [getEventsForDay(date, options) 문서](https://developers.google.com/apps-script/reference/calendar/calendar-app#geteventsfordaydate,-options)

```javascript
function vacationEvents(calendarId) {
  let calendar = CalendarApp.getCalendarById(calendarId);
  let today = new Date();

  // 오전반차, 오후반차, 휴가 키워드가 들어간 이벤트 목록을 가져옵니다.
  let morning = calendar.getEventsForDay(today, { search: "오전반차" });
  let afternoon = calendar.getEventsForDay(today, { search: "오후반차" });
  let allDay = calendar.getEventsForDay(today, { search: "휴가" });

  // 이벤트 개수를 합산합니다.
  let sum = morning.length + afternoon.length + allDay.length;

  // 휴가자가 없을 경우
  if (sum < 1) return;

  // 휴가자가 있을 경우
  let icon = "https://img.icons8.com/color/420/sunbathe.png";
  let text = `#### :flight_departure: 오늘의 휴가자는 ${sum}명입니다. :beach_umbrella:\n`;
  let attachments = [
    {
      // color 는 Default 값을 사용
      text: text,
      fields: [
        {
          short: true,
          title: `오전반차 (${morning.length})`,
          value: getText(morning, "[오전반차] ") || "",
        },
        {
          short: true,
          title: `오후반차 (${afternoon.length})`,
          value: getText(afternoon, "[오후반차] ") || "",
        },
        {
          short: true,
          title: `하루종일 (${allDay.length})`,
          value: getText(allDay, "[휴가] ") || "",
        },
      ],
    },
  ];

  postMmost("", icon, "VACATION", attachments);
}
```

![MmGoogleCalendar-5](https://user-images.githubusercontent.com/11264094/89148028-86ff2b80-d593-11ea-82ff-7807c66d145a.png)

#### 오늘의 생일

캘린더에 등록된 팀원들의 생일 정보를 가져옵니다. 작성 방법은 [오늘의 휴가](####오늘의-휴가)와 동일합니다.

```javascript
function birthDayEvents(calendarId) {
  let calendar = CalendarApp.getCalendarById(calendarId);
  let today = new Date();
  let events = calendar.getEventsForDay(today, { search: "생일" });

  // 생일자가 없을 경우
  if (events.length < 1) return;

  // 생일자가 있을 경우
  let text = "#### :tada: 오늘은 ";
  text += getText(events, "[생일] ");
  text += "의 생일입니다. :tada:\n###### 생일 축하 메시지를 남겨보세요!\n";

  let icon = "https://img.icons8.com/color/420/birthday.png";
  let img =
    "https://media1.giphy.com/media/KTN3GI7YNRRew/200.gif?cid=e1bb72ff6czno1tfvsvr13ma4p510sgswjib05mybqd1zjjp&rid=200.gif";
  let attachments = [
    {
      color: "#ff008c",
      text: text,
      image_url: img,
    },
  ];

  // API 호출
  postMmost("", icon, "BIRTHDAY", attachments);
}
```

![MmGoogleCalendar-6](https://user-images.githubusercontent.com/11264094/89151299-a26e3480-d59b-11ea-9882-de162192edab.png)

#### [소스코드 전체 보기](https://github.com/bomeekim/mattermost/blob/master/todayBot/index.js)

```
README.md 파일에서 설명하지 않은 부분이 있을 수 있으니 전체 소스코드를 꼭 확인해주세요
```

### Step4. 소스코드 실행 및 테스트

메시지가 웹훅 등록 시 설정한 채널로 보내지는지 확인합니다.

#### 방법1. 상단바 메뉴

1. 실행 > 함수실행
2. 함수 목록 중 선택

#### 방법2. 상단바 아이콘

스크립트 편집기 상단의 메뉴바에서 실행하려는 함수를 선택하고 실행버튼을 누르면 소스코드가 실행됩니다.

![MmGoogleCalendar-7](https://user-images.githubusercontent.com/11264094/89153793-9769d300-d5a0-11ea-86ff-882f35be20ca.png)

실행 후 내가 설정한 채널로 메시지가 왔는지 확인합니다. 아래는 예시 코드를 실행해 성공한 결과입니다.

![MmGoogleCalendar-8](https://user-images.githubusercontent.com/11264094/89154023-15c67500-d5a1-11ea-81cf-8755ed7a73b7.png)

참고로 **로그를 확인하려면** 상단바 메뉴에서 **보기 > 로그보기**를 하거나 **`Ctrl+Enter`** 를 하면 됩니다.

### Step5. 트리거 등록

특정 주기를 반복해 해당 함수를 실행하도록 트리거를 등록합니다.

1. 상단 메뉴에서 **수정 > 현재 프로젝트의 트리거** 클릭
2. **트리거 추가** 클릭
3. **실행할 함수, 이벤트 소스, 트리거 기반 시간 유형, 시간**을 선택하고 저장

![MmGoogleCalendar-9](https://user-images.githubusercontent.com/11264094/89154652-3cd17680-d5a2-11ea-92c4-b44b48b009cf.png)

### TODO

- [ ] 토,일 제외하기
- [ ] API response error 처리하기
- [ ] 다양한 인삿말/footer 문구 랜덤으로 보여주기
- [ ] 다른 봇들도 만들기
