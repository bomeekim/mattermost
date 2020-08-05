var calendarId = ""; // Google Calendar ID를 넣어주세요
var webhookUrl = ""; // Mattermost WebHook ID를 넣어주세요
var week = new Array('일', '월', '화', '수', '목', '금', '토');

function myFunction() {
  Logger.log("\n Event Notification Begin \n");
  
  // 토,일 제외
  let today = new Date();
  
  if (today.getDay() === 0 || today.getDay() === 1) return;
  
  // 오늘 일정 알람
  todayEvents(calendarId);
  
  // 휴가 알람
  vacationEvents(calendarId);
    
  // 오늘의 생일 알람
  birthDayEvents(calendarId);
  
  // 신규 입사자 알람
  newCrewEvents(calendarId);
  
  Logger.log("\n Finished! \n");
}

function todayEvents(calendarId) {
  let calendar = CalendarApp.getCalendarById(calendarId);
  let today = new Date();
  let todayText = Utilities.formatDate(today,"GMT+0900","YYYY년 MM월 dd일");
  todayText += ` ${week[today.getDay()]}요일`;
  
  let events = calendar.getEventsForDay(today);
    
  let icon = "https://img.icons8.com/color/420/iron-man.png";
  let text = '#### 안녕? :wave: 좋은 아침이에요! ';
  let msg = '';

  // 이벤트가 없을 때  
  if (events.length < 1) {
    text += '오늘은 특별한 일정이 없네요 :slightly_smiling_face:';
  } else {
    text += '오늘의 일정을 간략하게 알려드릴게요.'
    msg = '| 시간 | 제목 | 회의실 |\n|:------|:-------| :----------|\n';
  
    for (let i=0; i<events.length; i++) {
      let startTime = Utilities.formatDate(events[i].getStartTime(),"GMT+0900","HH시 mm분"); // 이벤트 시작 시간
      let endTime = Utilities.formatDate(events[i].getEndTime(),"GMT+0900","HH시 mm분"); // 이벤트 종료 시간
      let location = events[i].getLocation(); // 이벤트 회의실 정보
      let title = events[i].getTitle(); // 이벤트 제목
      
      // 휴가와 생일을 제외한 나머지 이벤트들만 가져옵니다.
      if (title.indexOf('휴가') === -1
        && title.indexOf('오전반차') === -1
        && title.indexOf('오후반차') === -1
        && title.indexOf('생일') === -1) {
         msg += `|${startTime === '00시 00분' ? '' : startTime + ' ~ '} ${endTime === '00시 00분' ? '' : endTime}|${title}|${location}|\n`;
      }
    }
  }
  
  let attachments = [
    {
      "color": "#cc101f",
      "text": text,
      "fields": [
        {
          "short": true,
          // 이벤트가 있을 경우 오늘 날짜를 타이틀로 보여줍니다.
          "title": events.length < 1 ? '' : todayText,  
          "value": msg // 이벤트 정보
        }
      ],
      // attachments 의 footer 정보
      "footer": '전 좀 쉬어야겠어요. 그럼 이만!',
      "footer_icon": "https://img.icons8.com/color/420/cocktail.png"
    }
  ];  
  
  // API 호출
  postMmost('', icon, 'J.A.R.V.I.S.', attachments);
}

function vacationEvents(calendarId) {
  let calendar = CalendarApp.getCalendarById(calendarId);
  let today = new Date();
  
  // 오전반차, 오후반차, 휴가 키워드가 들어간 이벤트 목록을 가져옵니다.
  let morning = calendar.getEventsForDay(today, { search: '오전반차' });
  let afternoon = calendar.getEventsForDay(today, { search: '오후반차' });
  let allDay = calendar.getEventsForDay(today, { search: '휴가' });
  
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
      "text": text,
      "fields": [
        {
          "short": true,
          "title": `오전반차 (${morning.length})`,
          "value": getText(morning, "[오전반차] ") || ''
        },
        {
          "short": true,
          "title": `오후반차 (${afternoon.length})`,
          "value": getText(afternoon, "[오후반차] ") || ''
        },
        {
          "short": true,
          "title": `하루종일 (${allDay.length})`,
          "value": getText(allDay, "[휴가] ") || ''
        }
      ]
    }
  ];
  
  // API 호출
  postMmost('', icon, 'VACATION', attachments);
}

function birthDayEvents(calendarId) {
  let calendar = CalendarApp.getCalendarById(calendarId);
  let today = new Date();
  let events = calendar.getEventsForDay(today, { search: '생일' });
  
  // 생일자가 없을 경우
  if (events.length < 1) return;
  
  // 생일자가 있을 경우
  let text = '#### :tada: 오늘은 ';
  text += getText(events, "[생일] ");
  text += '의 생일입니다. :tada:\n###### 생일 축하 메시지를 남겨보세요!\n';
  
  let icon = "https://img.icons8.com/color/420/birthday.png";
  let img = "https://media1.giphy.com/media/KTN3GI7YNRRew/200.gif?cid=e1bb72ff6czno1tfvsvr13ma4p510sgswjib05mybqd1zjjp&rid=200.gif";
  let attachments = [
    {
      "color": "#ff008c",
      "text": text,
      "image_url": img
    }
  ];
  
  // API 호출
  postMmost('', icon, 'BIRTHDAY', attachments);
}

function newCrewEvents(calendarId) {
  let calendar = CalendarApp.getCalendarById(calendarId);
  let today = new Date();
  let tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  let theDay = calendar.getEventsForDay(today, { search: '입사' });
  let beforeJoinDay = calendar.getEventsForDay(tomorrow, { search: '입사' });
 
  let icon = "https://img.icons8.com/color/420/rowing-2.png";
  let attachments = '';  
  
  // 내일 입사하는 사람이 없는 경우
  if (beforeJoinDay.length < 1) return;
  
  // 입사하는 사람이 있는 경우
  // case1 당일
  if (!!theDay) {
    let text = '#### [D-DAY] 오늘은 신규 크루 ';
    text += getText(theDay, "[입사] ");
    text += '님의 입사 첫날입니다.\n###### :tada: 입사를 진심으로 축하드립니다.:tada: @here 다들 격하게 환영해주세요!! :clap:';
    
    let img = "https://media.giphy.com/media/fxsqOYnIMEefC/giphy.gif";
    
    attachments = [
      {
        "color": "#f6da6e",
        "text": text,
        "image_url": img
      }
    ];
    
    // API 호출
    postMmost('', icon, 'WELCOME', attachments);
  }  
  
  // case2 하루 전
  if (!!beforeJoinDay) {
    let text = '#### [D-1] 오늘은 신규 크루 ';
    text += getText(beforeJoinDay, "[입사] ");
    text += '님의 입사 하루 전날입니다.\n###### :love_letter: 환영의 마음을 가득담아 환영 쪽지를 남겨주세요! :love_letter:\n';
    text += '1. :memo: 에이프릴 자리에서 에비츄 포스트잇을 받아간다.\n';
    text += '2. :thinking: 멘토로 선발되기 위한 환영 메시지를 고민한다.\n';
    text += '3. :clock12: 점심시간 전까지 작성해 신규 크루 자리에 붙여둔다.\n';
    
    attachments = [
      {
        "color": "#ff754c",
        "text": text,
        "footer": '환영 문화 및 쪽지와 관련된 문의는 에이프릴(@april)에게 해주세요.',
        "footer_icon": "https://img.icons8.com/color/420/communication.png"
      }
    ];   
    
    // API 호출
    postMmost('', icon, 'WELCOME', attachments);
  } 
}

/**
 * 이벤트 제목에 말머리가 있을 경우 이를 파싱해 말머리를 제외한 제목을 리턴해주는 함수
 * @params events 이벤트 정보
 * @params seperator 파싱할 문구
 */
function getText(events, seperator) {
  let text = '';
  
  for (let i=0; i<events.length; i++) {
    let title = events[i].getTitle().split(seperator)[1];
    
    if ((events.lenght === 1 && i === 0) || i === events.length - 1) {
      text += title;
    } else {
      text += `${title}, `;
    }
  }
  
  return text;
}
  
/**
 * 메세지를 보낼 때 사용하는 함수로 POST 형식으로 보냅니다.
 * @params msgBody 보낼 메시지 (해당 소스코드에서는 사용하지 않습니다.)
 * @params iconUrl 봇 프로필 사진용 아이콘 URL
 * @params userName 봇 프로필 이름
 * @params attachments 메시지 attachments
 */
function postMmost(msgBody, iconUrl, userName, attachments = []){
  let payload = {
    "text" : msgBody,
    // iconUrl 이 없는 경우 구글 캘린더 아이콘을 사용합니다.
    "icon_url" : iconUrl || "https://img.icons8.com/color/420/google-calendar.png",
    // userName이 없는 경우 기본 이름(TODAY EVENTS)을 사용합니다.
    "username" : userName || "TODAY EVENTS",
    "attachments": attachments
  };
  
  // REST API Options
  let options = {
    "method" : "POST",
    "contentType" : "application/json",
    "payload" : JSON.stringify(payload)
  };
  
  let response = UrlFetchApp.fetch(webhookUrl, options);
  let content = response.getContentText("UTF-8");
}
