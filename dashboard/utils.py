import time
import random

# Constants
MAX_CROWD = 82500
MAX_PROMPT_LEN = 1000

# --- MOCK CHAT RESPONSE GENERATOR ---
def get_mock_chat_response(prompt: str, context: str) -> str:
    query = prompt.lower()
    if any(k in query for k in ['crowd', 'capacity', 'people', 'attendance', 'gate', 'flow']):
        return f"Analysis of telemetry ({context}) indicates MetLife Stadium occupancy is near capacity. Flow rates at the main gates are nominal. Lot G gate exhibits a micro-congestion spike (avg wait 5.2 mins), but directing overflow to Gate C has successfully mitigated the bottleneck."

    if any(k in query for k in ['security', 'sentinel', 'incident', 'guard', 'biometric', 'clearance']):
        return "All security systems are online. Protocol SENTINEL is active. Biometric facial-recognition checkpoints at Gates A and C are clearing ticket holders with 99.4% authentication confidence. Immediate response units are deployed and ready for dispatch."

    if any(k in query for k in ['transport', 'metro', 'shuttle', 'bus', 'traffic', 'route']):
        return "Transport logistics are operating smoothly. NJ Transit Meadowlands Rail Line trains are arriving every 4 minutes. Express Shuttle Bus 351 has an 8-minute dispatch loop. Pedestrian walkways (The Blue Route) are operating at level A comfort."

    if any(k in query for k in ['temp', 'climate', 'cool', 'air', 'weather', 'hvac']):
        return "Environmental conditions are stable. Local temperature is 24°C. Pitch climate is maintained with vertical cross-ventilation. Executive suites HVAC systems are set to 21.5°C with efficiency indices 12% above 2026 benchmarks."

    if any(k in query for k in ['match', 'score', 'game', 'kickoff', 'team', 'goal']):
        return "FIFA 2026 Group A Match: USA vs Italy is currently LIVE at MetLife Stadium — Score: 2-1 (72'). Canada vs Mexico kicks off tomorrow in Vancouver. All schedules are on track with no delays."

    if any(k in query for k in ['energy', 'power', 'solar', 'grid', 'sustainability']):
        return "Stadium energy consumption is at 94.2 MWh with solar canopy arrays contributing 18.3 MWh (19.4%). We are 12% more efficient than the 2026 FIFA Green Stadium Guidelines. Platinum Eco-Rating status is maintained."

    return "I have analyzed the stadium telemetry. Ingress and egress flows are balanced, security is in nominal alert status, and environmental conditions are stable. Let me know if you would like me to simulate flow redirections or run system diagnostics."


# --- MOCK CONCIERGE RESPONSE GENERATOR ---
def get_mock_concierge_response(prompt: str, lang: str) -> str:
    query = prompt.lower()

    mock_responses = {
        'EN': {
            'dining': "Your Grace, Royal Catering has curated a bespoke menu featuring local Hudson Valley delicacies, wagyu beef medallions, and truffle soufflés. A bottle of Dom Pérignon 2012 is chilled to exactly 8°C in your Suite 402.",
            'transit': "Your Grace, your private hydrogen shuttle is scheduled to arrive at the West VIP lane at MetLife Stadium at 15:38. Estimated travel time to Manhattan is 15 minutes. The heliport at Meadowlands is cleared and ready for your departure at 21:30.",
            'climate': "Your Grace, the pitch climate is locked at 22°C with automated cross-flow ventilation. Your suite climate control has been pre-adjusted to your preferred 21.5°C.",
            'security': "Your Grace, security protocol SENTINEL is active. Elite guard units are positioned at all Level 4 entryways, and biometric scans are synchronized with your device.",
            'default': "Your Grace, as your Royal Concierge, I am at your service. I can verify catering selections, schedule your shuttle/helicopter departure, or coordinate biometric security access."
        },
        'AR': {
            'dining': "سموّك، لقد أعدت خدمة الضيافة الملكية قائمة طعام خاصة تحتوي على مأكولات وادي هادسون المحلية، وشرائح لحم واغيو، وسوفليه الترفل. زجاجة دوم بيرينيون 2012 مبردة تمامًا عند 8 درجات مئوية في الجناح 402.",
            'transit': "سموّك، من المقرر أن تصل حافلتك الهيدروجينية الخاصة إلى مسار كبار الشخصيات الغربي في استاد ميتلايف في تمام الساعة 15:38. وقت السفر المقدر إلى مانهاتن هو 15 دقيقة. مهبط المروحيات جاهز ومصرح لمغادرتك بعد المباراة في الساعة 21:30.",
            'climate': "سموّك، تم ضبط مناخ الملعب عند 22 درجة مئوية مع تهوية تلقائية متقاطعة التدفق. تم تعديل التحكم في مناخ جناحك مسبقًا إلى 21.5 درجة مئوية المفضلة لديك.",
            'security': "سموّك، بروتوكول الأمن SENTINEL نشط. تم توزيع وحدات الحراسة النخبة عند جميع مداخل المستوى 4، والممرات الحيوية متزامنة مع جهازك.",
            'default': "سموّك، بصفتي بوابك الملكي الرقمي، أنا في خدمتك. يمكنني التحقق من خيارات الضيافة، أو جدولة رحلاتك، أو تنسيق الوصول الأمني الحيوي."
        },
        'FR': {
            'dining': "Votre Grâce, le Service Traiteur Royal a élaboré un menu sur mesure comprenant des spécialités locales de la vallée de l'Hudson, des médaillons de bœuf wagyu et des soufflés aux truffes. Une bouteille de Dom Pérignon 2012 est fraîchement conservée à 8°C dans votre Suite 402.",
            'transit': "Votre Grâce, votre navette privée à hydrogène est programmée pour arriver à la voie VIP Ouest de MetLife Stadium à 15h38. Le temps de trajet estimé vers Manhattan est de 15 minutes. L'héliport de Meadowlands est dégagé pour votre départ à 21h30.",
            'climate': "Votre Grâce, la température du stade est stabilisée à 22°C avec ventilation transversale automatisée. Le climatiseur de votre suite a été pré-ajusté à votre préférence de 21,5°C.",
            'security': "Votre Grâce, le protocole de sécurité SENTINEL est actif. Les unités de garde d'élite sont postées à toutes les entrées du niveau 4 et vos données biométriques sont synchronisées.",
            'default': "Votre Grâce, en tant que votre Concierge Royal, je suis à votre entière disposition pour vos réservations gastronomiques, transports VIP ou accès de sécurité."
        },
        'ES': {
            'dining': "Su Gracia, el Catering Real ha preparado un menú exclusivo con delicias locales del valle de Hudson, medallones de ternera wagyu y suflés de trufa. Una botella de Dom Pérignon 2012 está enfriada a exactamente 8°C en su Suite 402.",
            'transit': "Su Gracia, su transporte privado de hidrógeno está programado para llegar al carril VIP Oeste de MetLife Stadium a las 15:38. El tiempo estimado de viaje a Manhattan es de 15 minutos. El helipuerto de Meadowlands está despejado para su salida a las 21:30.",
            'climate': "Su Gracia, el clima del campo está regulado a 22°C con ventilación cruzada automatizada. El control de temperatura de su suite se ha ajustado a sus preferidos 21.5°C.",
            'security': "Su Gracia, el protocolo de seguridad SENTINEL está activo. Las unidades de guardia de élite están posicionadas en todos los accesos del Nivel 4 y los escaneos biométricos están sincronizados.",
            'default': "Su Gracia, como su Conserje Real, estoy a su servicio. Puedo verificar selecciones de catering, programar su salida en helicóptero o coordinar el acceso biométrico de seguridad."
        },
        'PT': {
            'dining': "Sua Graça, o Buffet Real preparou um menu exclusivo com iguarias locais do Vale do Hudson, medalhões de carne wagyu e suflês de trufas. Uma garrafa de Dom Pérignon 2012 está resfriada a exatamente 8°C na sua Suíte 402.",
            'transit': "Sua Graça, sua van de hidrogênio privada deve chegar à faixa VIP Oeste do MetLife Stadium às 15:38. O tempo estimado de viagem para Manhattan é de 15 minutos. O heliporto de Meadowlands está liberado para sua partida às 21:30.",
            'climate': "Sua Graça, o clima do gramado está travado em 22°C com ventilação cruzada automatizada. O controle de temperatura da sua suíte foi pré-ajustado para os seus 21,5°C preferidos.",
            'security': "Sua Graça, o protocolo de segurança SENTINEL está ativo. Unidades de guarda de elite estão posicionadas em todas as entradas do Nível 4 e a biometria está sincronizada.",
            'default': "Sua Graça, como seu Concierge Real, estou ao seu dispor. Posso verificar opções de catering, agendar sua partida de helicóptero ou coordenar acesso de segurança biométrico."
        },
        'ZH': {
            'dining': "阁下，皇家餐饮部为您精心准备了哈德逊河谷当地美食、和牛菲力与松露舒芙蕾。一瓶 2012 年唐培里侬香槟已在您的 402 号尊贵套房中冷藏至 8°C。",
            'transit': "阁下，您的私人氢动力穿梭巴士预计将于 15:38 到达大都会人寿体育场（MetLife Stadium）西侧 VIP 通道。前往曼哈顿的预计行驶时间为 15 分钟。草甸地（Meadowlands）直升机场已清理完毕，随时为您在 21:30 的起飞做好了准备。",
            'climate': "阁下，赛场草坪温度锁定在 22°C，配有自动交叉流通风。您的套房温度已预先调节至您偏好的 21.5°C。",
            'security': "阁下，SENTINEL 安全协议已启动。精锐警卫部队已部署在所有 4 层入口处，生物识别扫描已与您的设备同步。",
            'default': "阁下，作为您的皇家私人管家，我随时为您服务。我可以为您确认餐饮选择、安排穿梭巴士或直升机行程，或者协调生物识别安全通道。"
        }
    }

    selected_lang = lang if lang in mock_responses else 'EN'
    lang_set = mock_responses[selected_lang]

    if any(k in query for k in ['catering', 'dining', 'food', 'caviar', 'champagne', 'menu', 'eat', 'drink', 'gourmet']):
        return lang_set['dining']
    if any(k in query for k in ['shuttle', 'transit', 'transport', 'heliport', 'car', 'helicopter', 'flight', 'departure']):
        return lang_set['transit']
    if any(k in query for k in ['temp', 'climate', 'cool', 'air', 'temperature', 'weather']):
        return lang_set['climate']
    if any(k in query for k in ['protocol', 'security', 'guard', 'clearance', 'sentinel']):
        return lang_set['security']

    return lang_set['default']


# --- MOCK INTELLIGENCE ALERTS GENERATOR ---
def generate_mock_alerts(crowd_count: int, metro_time: int):
    alerts = []

    if crowd_count > 80000:
        alerts.append({
            "id": "mock_alert_crowd",
            "type": "HIGH PRIORITY",
            "title": "Lot G flow limits reached.",
            "description": "AI flow modeling suggests redirecting Sectors 102-104 ticketing to Gate C immediately.",
            "timeLabel": "REAL-TIME",
            "color": "#FF5252"
        })
    else:
        alerts.append({
            "id": "mock_alert_flow",
            "type": "OBSERVATION",
            "title": "Flow density nominal.",
            "description": "Pedestrian throughput at Gates A, B, and C is stable. Average ingress speed is 4.2 seconds/person.",
            "timeLabel": "T-20 MINS",
            "color": "#00E676"
        })

    if metro_time > 7:
        alerts.append({
            "id": "mock_alert_metro",
            "type": "HIGH PRIORITY",
            "title": "NJ Transit scheduling backlog.",
            "description": f"Meadowlands line wait time extended to {metro_time} mins due to high platform density. Promoting 'The Blue Route' walking path to egress crowds.",
            "timeLabel": "T-5 MINS",
            "color": "#D4FF00"
        })
    else:
        alerts.append({
            "id": "mock_alert_vip",
            "type": "EVENT PROTOCOL",
            "title": "VIP Motorcade arrival imminent.",
            "description": "Level 4 security clearance engaged for West Gate VIP drop-off. Keep lanes clear.",
            "timeLabel": "T-10 MINS",
            "color": "#D4FF00"
        })

    alerts.append({
        "id": "mock_alert_social",
        "type": "SOCIAL SIGNAL",
        "title": "Fan sentiment is peaking.",
        "description": "Social monitoring shows 94% positive sentiment inside the bowl. Crowd sound signature at 92dB.",
        "timeLabel": "REAL-TIME",
        "color": "#00E676"
    })

    alerts.append({
        "id": "mock_alert_energy",
        "type": "OBSERVATION",
        "title": "Energy consumption nominal.",
        "description": "Solar canopy arrays contributing 18.3 MWh. 12% below benchmark — Platinum Eco-Rating maintained.",
        "timeLabel": "LIVE",
        "color": "#00E676"
    })

    return alerts


# --- RICH DUMMY TELEMETRY DATA ---
def generate_telemetry_data():
    now_ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    base_crowd = 78000
    r = random.Random(int(time.time() / 3))
    crowd_delta = r.randint(-150, 150)

    return {
        "timestamp": now_ts,
        "stadium": {
            "name": "MetLife Stadium",
            "city": "East Rutherford, NJ (NY/NJ Host City)",
            "capacity": MAX_CROWD,
            "currentAttendance": max(70000, min(MAX_CROWD, base_crowd + crowd_delta)),
            "occupancyPct": round((base_crowd + crowd_delta) / MAX_CROWD * 100, 1),
            "pitchTemp": 22.0,
            "pitchHumidity": 65.0,
            "ambientTemp": 24.5,
            "hvacLoad": 30.5,
            "energyConsumption": 92.4,
            "solarGeneration": 18.3,
            "noiseDb": 92.0,
            "airQualityIndex": 42
        },
        "matches": [
            {
                "id": "m1",
                "status": "LIVE",
                "homeTeam": "USA",
                "awayTeam": "Italy",
                "homeFlag": "🇺🇸",
                "awayFlag": "🇮🇹",
                "homeScore": 2,
                "awayScore": 1,
                "minute": 72,
                "venue": "MetLife Stadium",
                "group": "Group A",
                "kickoff": "18:00"
            },
            {
                "id": "m2",
                "status": "UPCOMING",
                "homeTeam": "Canada",
                "awayTeam": "Mexico",
                "homeFlag": "🇨🇦",
                "awayFlag": "🇲🇽",
                "homeScore": 0,
                "awayScore": 0,
                "minute": 0,
                "venue": "MetLife Stadium",
                "group": "Group A",
                "kickoff": "21:00"
            },
            {
                "id": "m3",
                "status": "COMPLETED",
                "homeTeam": "Mexico",
                "awayTeam": "Germany",
                "homeFlag": "🇲🇽",
                "awayFlag": "🇩🇪",
                "homeScore": 1,
                "awayScore": 0,
                "minute": 90,
                "venue": "Estadio Azteca",
                "group": "Group B",
                "kickoff": "15:00"
            },
            {
                "id": "m4",
                "status": "COMPLETED",
                "homeTeam": "Argentina",
                "awayTeam": "France",
                "homeFlag": "🇦🇷",
                "awayFlag": "🇫🇷",
                "homeScore": 3,
                "awayScore": 2,
                "minute": 90,
                "venue": "BC Place",
                "group": "Group C",
                "kickoff": "12:00"
            }
        ],
        "gates": [
            {"id": "gate1", "name": "Gate A (North)", "throughput": 1240, "capacity": 1500, "waitMins": 2.5, "status": "OPEN"},
            {"id": "gate2", "name": "Gate B (East)", "throughput": 980, "capacity": 1200, "waitMins": 3.0, "status": "OPEN"},
            {"id": "gate3", "name": "Gate C (South)", "throughput": 760, "capacity": 1200, "waitMins": 1.5, "status": "OPEN"},
            {"id": "gate4", "name": "Gate D (West VIP)", "throughput": 320, "capacity": 400, "waitMins": 6.5, "status": "CONGESTED"},
            {"id": "gate5", "name": "Gate E (South-East)", "throughput": 1100, "capacity": 1400, "waitMins": 2.0, "status": "OPEN"}
        ],
        "transport": {
            "metro": {
                "line": "Meadowlands Rail Line (NJ Transit)",
                "arrivalMins": 4,
                "frequency": "Every 4 minutes",
                "platform": "Track 1 – Meadowlands Station",
                "status": "ON_TIME",
                "passengerLoad": 82.5
            },
            "shuttle": {
                "name": "Express Shuttle Bus 351",
                "arrivalMins": 8,
                "route": "MetLife Stadium → Port Authority",
                "status": "EN_ROUTE",
                "passengers": 12,
                "capacity": 50
            },
            "greenMile": {
                "name": "The Blue Route",
                "walkMins": 15,
                "distance": "450m",
                "crowdLevel": "LOW",
                "comfortIndex": "A+"
            }
        },
        "staffing": {
            "securityUnits": 32,
            "medicalTeams": 8,
            "cateringStaff": 240,
            "groundCrew": 45,
            "vipButlers": 12,
            "incidentResponse": {
                "medical": {"status": "STANDBY", "units": 4, "location": "South Medical Bay"},
                "security": {"status": "ACTIVE", "units": 6, "location": "All VIP Entries"},
                "fire": {"status": "STANDBY", "units": 3, "location": "Control Room A"}
            }
        },
        "sentiment": {
            "overall": 94,
            "categories": {
                "matchExperience": 97,
                "foodAndBeverage": 89,
                "transport": 85,
                "facilities": 91,
                "security": 93
            },
            "socialPulse": {
                "positivePosts": 142800,
                "negativePosts": 9100,
                "trendingHashtag": "#FIFAWorldCup2026",
                "mentionsPerMinute": 2800
            },
            "crowdSoundDb": 92.0
        },
        "security": {
            "protocol": "SENTINEL",
            "alertLevel": "GREEN",
            "biometricGates": {"online": 12, "total": 12, "authSuccessRate": 99.4},
            "cameraFeed": {"online": 48, "total": 48, "coveragePct": 100},
            "perimeter": "SECURE",
            "incidents": 0,
            "lastSweep": now_ts
        }
    }
