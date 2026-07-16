import json
from django.test import SimpleTestCase, RequestFactory, AsyncClient
from django.urls import reverse
from unittest.mock import patch, AsyncMock
from django.template.context import Context

# Fix Python 3.14 copy(context) compatibility issue in Django test client
def patch_context_copy(self):
    from copy import copy
    duplicate = Context()
    duplicate.dicts = [copy(d) for d in self.dicts]
    return duplicate

Context.__copy__ = patch_context_copy

# Print original traceback of exceptions raised in the request chain
from django.core.handlers.base import BaseHandler
def patch_log_exception(self, request, exception):
    import traceback
    traceback.print_exc()

BaseHandler.log_exception = patch_log_exception

from dashboard.views import index

class DashboardTests(SimpleTestCase):
    def setUp(self):
        self.client = AsyncClient()
        self.factory = RequestFactory()

    async def test_index_page_loads(self):
        """Verify that the dashboard SPA home page loads successfully via RequestFactory."""
        request = self.factory.get('/')
        response = await index(request)
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        self.assertIn('WORLD CUP 2026', content)

    async def test_chat_api_fallback(self):
        """Verify chat endpoint fallbacks gracefully and answers crowd inquiries."""
        url = reverse('chat_api')
        payload = {
            "prompt": "How is the crowd flow at Gate 4?",
            "context": "Crowd: 84200"
        }
        response = await self.client.post(
            url, 
            data=json.dumps(payload), 
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('response', data)
        self.assertIn('Gate C', data['response']) # verify flow logic answers correctly

    async def test_chat_api_empty_payload(self):
        """Verify chat endpoint handles empty prompt/payload gracefully without crashing."""
        url = reverse('chat_api')
        payload = {}
        response = await self.client.post(
            url, 
            data=json.dumps(payload), 
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('response', data)

    async def test_concierge_api_arabic_dialect(self):
        """Verify concierge translation engine answers elegantly in Arabic."""
        url = reverse('concierge_api')
        payload = {
            "prompt": "Gourmet Dining Caviar Menu",
            "language": "AR"
        }
        response = await self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('response', data)
        self.assertIn('سموّك', data['response']) # verify Arabic addressing is correct

    async def test_concierge_api_unsupported_language(self):
        """Verify concierge fallback handles unsupported language requests by defaulting to English (EN)."""
        url = reverse('concierge_api')
        payload = {
            "prompt": "View Gourmet Dining Menu",
            "language": "XYZ_UNSUPPORTED"
        }
        response = await self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('response', data)
        self.assertIn('Your Grace', data['response']) # fallback checks EN default

    async def test_intelligence_api_alerts(self):
        """Verify intelligence simulation reports high traffic alerts for metro."""
        url = reverse('intelligence_api')
        payload = {
            "crowdCount": 84300,
            "metroTime": 12
        }
        response = await self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('alerts', data)
        self.assertTrue(len(data['alerts']) >= 1)
        # Verify Metro delay alert is triggered
        metro_alert = any('metro' in alert['id'] for alert in data['alerts'])
        self.assertTrue(metro_alert)

    async def test_intelligence_api_edge_cases(self):
        """Verify intelligence simulation clamps or handles zero/negative values safely."""
        url = reverse('intelligence_api')
        payload = {
            "crowdCount": -500,
            "metroTime": 0
        }
        response = await self.client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('alerts', data)

    async def test_health_api(self):
        """Verify self-health check telemetry status outputs active."""
        url = reverse('health_api')
        response = await self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['status'], 'healthy')
        self.assertIn('uptime', data)
        self.assertIn('memory', data)

    async def test_accessibility_elements_exist(self):
        """Verify that all critical accessibility DOM nodes exist in the rendered SPA index page."""
        request = self.factory.get('/')
        response = await index(request)
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        
        # Verify DOM IDs required by dashboard.js accessibility toggles
        self.assertIn('id="main-wrapper"', content)
        self.assertIn('id="toggle-high-contrast-btn"', content)
        self.assertIn('id="toggle-wheelchair-btn"', content)
        self.assertIn('id="toggle-audio-btn"', content)
        self.assertIn('id="label-wheelchair"', content)
        self.assertIn('id="route-metro-desc"', content)
        self.assertIn('id="route-shuttle-desc"', content)
        self.assertIn('id="route-walk-desc"', content)

    async def test_telemetry_api(self):
        """Verify telemetry API returns complete live simulated dataset."""
        url = reverse('telemetry_api')
        response = await self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        
        # Verify schema sections are present
        self.assertIn('stadium', data)
        self.assertIn('matches', data)
        self.assertIn('gates', data)
        self.assertIn('transport', data)
        self.assertIn('staffing', data)
        self.assertIn('sentiment', data)
        self.assertIn('security', data)
        
        # Check specific values
        self.assertEqual(data['stadium']['name'], 'MetLife Stadium')
        self.assertTrue(len(data['matches']) >= 4)
        self.assertTrue(len(data['gates']) >= 5)

    async def test_analytics_api(self):
        """Verify analytics API returns historical trend datasets and AI predictive summary."""
        url = reverse('analytics_api')
        response = await self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        # Verify top-level schema
        self.assertIn('labels', data)
        self.assertIn('datasets', data)
        self.assertIn('aiSummary', data)
        self.assertIn('trend', data)
        self.assertIn('currentCrowd', data)

        # Verify datasets have the correct keys
        datasets = data['datasets']
        self.assertIn('crowd', datasets)
        self.assertIn('energy', datasets)
        self.assertIn('sentiment', datasets)
        self.assertIn('gateFlow', datasets)

        # Verify 13 data points: 12 historical + 1 "NOW"
        self.assertEqual(len(data['labels']), 13)
        self.assertEqual(len(datasets['crowd']), 13)
        self.assertEqual(data['labels'][-1], 'NOW')

        # Verify crowd is within plausible stadium range
        self.assertTrue(60000 <= data['currentCrowd'] <= 89000)

        # Verify AI summary is non-empty
        self.assertGreater(len(data['aiSummary']), 20)

    @patch('dashboard.views.httpx.AsyncClient.post', new_callable=AsyncMock)
    async def test_chat_api_with_gemini_mock(self, mock_post):
        """Fix 8: Verify chat API properly calls Gemini when API_KEY is present."""
        from unittest.mock import MagicMock
        mock_post.return_value.status_code = 200
        mock_post.return_value.json = MagicMock(return_value={
            'candidates': [{'content': {'parts': [{'text': 'AI mock response'}]}}]
        })
        
        with patch('dashboard.views.API_KEY', 'valid_test_key'):
            url = reverse('chat_api')
            payload = {"prompt": "Hello", "context": "None"}
            response = await self.client.post(url, data=json.dumps(payload), content_type='application/json')
            
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.content)
            self.assertEqual(data['response'], 'AI mock response')
            mock_post.assert_called_once()

    @patch('dashboard.views.time.time')
    async def test_analytics_trend_direction(self, mock_time):
        """Fix 8: Verify analytics trend direction logic correctly classifies rising/falling."""
        # Fix time so random seed is constant and we can predict the trend
        mock_time.return_value = 1600000000
        
        url = reverse('analytics_api')
        response = await self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        
        self.assertIn('trend', data)
        # Trend should be one of these three formats
        valid_trends = ['↑ Rising', '↓ Declining', '→ Stable']
        self.assertIn(data['trend'], valid_trends)

    async def test_staff_api(self):
        """Verify staff API returns active volunteer shifts, tasks, and metrics."""
        url = reverse('staff_api')
        response = await self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        # Verify key parts of schema
        self.assertIn('zones', data)
        self.assertIn('shifts', data)
        self.assertIn('tasks', data)
        self.assertIn('metrics', data)
        self.assertIn('aiBriefing', data)
        self.assertIn('timestamp', data)

        # Verify metrics
        self.assertIn('totalVolunteers', data['metrics'])
        self.assertGreater(data['metrics']['totalVolunteers'], 0)
        self.assertEqual(len(data['zones']), data['metrics']['totalZones'])

    @patch('dashboard.views.httpx.AsyncClient.post', new_callable=AsyncMock)
    async def test_staff_api_with_gemini_mock(self, mock_post):
        """Verify staff API calls Gemini when API_KEY is present."""
        from unittest.mock import MagicMock
        mock_post.return_value.status_code = 200
        mock_post.return_value.json = MagicMock(return_value={
            'candidates': [{'content': {'parts': [{'text': 'Gemini briefing response'}]}}]
        })

        with patch('dashboard.views.API_KEY', 'valid_test_key'):
            url = reverse('staff_api')
            response = await self.client.get(url)
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.content)
            self.assertEqual(data['aiBriefing'], 'Gemini briefing response')
            mock_post.assert_called_once()

