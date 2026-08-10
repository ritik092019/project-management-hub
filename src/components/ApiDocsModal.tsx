import React, { useState, useEffect } from 'react';
import { runServerUnitTests, fetchOpenApiDocs } from '../services/api.js';
import { ApiTestSummary } from '../types.js';
import { Terminal, CheckCircle2, XCircle, Play, FileCode, Server, ShieldCheck, RefreshCw, Copy, Check } from 'lucide-react';

export const ApiDocsModal: React.FC = () => {
  const [openApiSpec, setOpenApiSpec] = useState<any>(null);
  const [testSummary, setTestSummary] = useState<ApiTestSummary | null>(null);
  const [testingRunning, setTestingRunning] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'tests' | 'endpoints' | 'spring-boot-architecture'>('tests');

  // Custom API tester state
  const [testUrl, setTestUrl] = useState('/api/projects?startDate=2026-01-01');
  const [testMethod, setTestMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [responseJson, setResponseJson] = useState<string>('');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [executingCustom, setExecutingCustom] = useState(false);

  useEffect(() => {
    fetchOpenApiDocs().then(data => setOpenApiSpec(data)).catch(() => {});
    handleRunTests();
  }, []);

  const handleRunTests = async () => {
    try {
      setTestingRunning(true);
      const summary = await runServerUnitTests();
      setTestSummary(summary);
    } catch (e) {
      console.error(e);
    } finally {
      setTestingRunning(false);
    }
  };

  const handleExecuteCustomTest = async () => {
    try {
      setExecutingCustom(true);
      const token = localStorage.getItem('jwt_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(testUrl, { method: testMethod, headers });
      setResponseStatus(res.status);
      const data = await res.json();
      setResponseJson(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseStatus(500);
      setResponseJson(JSON.stringify({ error: err.message || 'Network request failed' }, null, 2));
    } finally {
      setExecutingCustom(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(text);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  return (
    <div id="api-docs-container" className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Server className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">RESTful API Specification & Automated Unit Testing</h2>
          </div>
          <p className="text-xs text-slate-400">
            Enterprise Spring Boot REST Controller contracts, JWT Bearer security, and server-side unit test suite runner.
          </p>
        </div>

        <button
          id="btn-run-unit-tests"
          onClick={handleRunTests}
          disabled={testingRunning}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${testingRunning ? 'animate-spin' : ''}`} />
          <span>{testingRunning ? 'Executing Test Suite...' : 'Run REST Unit Tests'}</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('tests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'tests'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>Unit Test Runner</span>
          {testSummary && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 rounded-full font-bold">
              {testSummary.passed}/{testSummary.total} Passed
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('endpoints')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'endpoints'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4 text-blue-400" />
          <span>Interactive REST Playground</span>
        </button>

        <button
          onClick={() => setActiveSubTab('spring-boot-architecture')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'spring-boot-architecture'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span>Spring Boot Architecture Specs</span>
        </button>
      </div>

      {/* TAB 1: Unit Test Runner */}
      {activeSubTab === 'tests' && (
        <div className="space-y-4">
          
          {/* Test Metrics Summary */}
          {testSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Unit Tests</span>
                <div className="text-2xl font-extrabold text-white mt-1">{testSummary.total}</div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
                <span className="text-[11px] text-green-400 font-bold uppercase tracking-wider">Tests Passed</span>
                <div className="text-2xl font-extrabold text-green-400 mt-1">{testSummary.passed}</div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Execution Duration</span>
                <div className="text-2xl font-extrabold text-blue-400 mt-1">{testSummary.durationMs} ms</div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Test Timestamp</span>
                <div className="text-xs font-mono text-slate-300 mt-2 truncate">
                  {new Date(testSummary.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* Test Execution Output Log List */}
          <div className="p-6 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 font-mono text-xs shadow-inner space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-400" />
                <span className="font-bold text-white">JUnit 5 & REST Assured Test Suite Console Output</span>
              </div>
              <button
                onClick={handleRunTests}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-run Suite
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {testSummary?.results.map((test, index) => (
                <div
                  key={test.id || index}
                  className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {test.status === 'PASSED' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="font-bold text-slate-200">{test.suite}</span>
                      <span className="text-slate-500">::</span>
                      <span className="text-blue-300 font-semibold">{test.name}</span>
                    </div>
                    {test.error && (
                      <p className="text-rose-400 text-[11px] pl-6">{test.error}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-slate-500 text-[11px]">{test.durationMs}ms</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${test.status === 'PASSED' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                      {test.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Interactive REST Playground */}
      {activeSubTab === 'endpoints' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Endpoint Selector & Custom Executor */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Live REST API Request Sandbox</h3>
              <p className="text-xs text-slate-400">Test live requests against backend endpoints with real parameter filters and JWT auth.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">HTTP Method & Path</label>
                <div className="flex items-center gap-2">
                  <select
                    value={testMethod}
                    onChange={e => setTestMethod(e.target.value as any)}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  <input
                    type="text"
                    value={testUrl}
                    onChange={e => setTestUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Sample Quick Presets */}
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">Quick Endpoint Test Presets:</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => { setTestMethod('GET'); setTestUrl('/api/projects?startDate=2026-05-01&endDate=2026-07-31'); }}
                    className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 cursor-pointer"
                  >
                    GET Date Filtered Projects
                  </button>
                  <button
                    onClick={() => { setTestMethod('GET'); setTestUrl('/api/projects?tech=Spring%20Boot,PostgreSQL'); }}
                    className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 cursor-pointer"
                  >
                    GET Tech Stack Search
                  </button>
                  <button
                    onClick={() => { setTestMethod('GET'); setTestUrl('/api/analytics'); }}
                    className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 cursor-pointer"
                  >
                    GET Analytics
                  </button>
                  <button
                    onClick={() => { setTestMethod('GET'); setTestUrl('/api/auth/me'); }}
                    className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 cursor-pointer"
                  >
                    GET Auth Context (JWT)
                  </button>
                </div>
              </div>

              <button
                onClick={handleExecuteCustomTest}
                disabled={executingCustom}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {executingCustom ? 'Executing Request...' : 'Send Live Request →'}
              </button>
            </div>
          </div>

          {/* Response Inspector */}
          <div className="p-6 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-slate-300">HTTP Response Inspector</span>
              {responseStatus && (
                <span className={`px-2 py-0.5 rounded font-bold ${responseStatus >= 200 && responseStatus < 300 ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                  Status: {responseStatus}
                </span>
              )}
            </div>

            <pre className="p-3 bg-slate-900 rounded-xl max-h-80 overflow-y-auto text-[11px] text-cyan-300 leading-relaxed whitespace-pre-wrap border border-slate-800">
              {responseJson || '// Click "Send Live Request" to view JSON response payload...'}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: Spring Boot Architecture Specs */}
      {activeSubTab === 'spring-boot-architecture' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Spring Boot 3 + PostgreSQL Architecture Reference</h3>
            <p className="text-xs text-slate-400">Cleaner enterprise layout mapping Spring Controller annotations and JPA repositories.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-xs text-blue-400">ProjectController.java</h4>
              <p className="text-[11px] text-slate-300 font-mono">
                @RestController @RequestMapping("/api/projects")<br />
                @CrossOrigin(origins = "*")<br />
                public class ProjectController &#123;<br />
                &nbsp;&nbsp;@GetMapping<br />
                &nbsp;&nbsp;public ResponseEntity&lt;ProjectResponse&gt; searchProjects(<br />
                &nbsp;&nbsp;&nbsp;&nbsp;@RequestParam(required=false) LocalDate startDate,<br />
                &nbsp;&nbsp;&nbsp;&nbsp;@RequestParam(required=false) LocalDate endDate...<br />
                &nbsp;&nbsp;)
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-xs text-green-400">ProjectRepository.java (PostgreSQL JPA)</h4>
              <p className="text-[11px] text-slate-300 font-mono">
                @Repository<br />
                public interface ProjectRepository extends JpaRepository&lt;ProjectEntity, String&gt; &#123;<br />
                &nbsp;&nbsp;List&lt;ProjectEntity&gt; findByDeploymentDateBetween(<br />
                &nbsp;&nbsp;&nbsp;&nbsp;LocalDate startDate, LocalDate endDate<br />
                &nbsp;&nbsp;);<br />
                &#125;
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
