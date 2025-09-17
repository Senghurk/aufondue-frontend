"use client";

import { useTranslation } from "../hooks/useTranslation";

export default function ReportDetailsModal({ 
  isOpen, 
  onClose, 
  report, 
  sastoken, 
  onMediaView,
  showUpdateHistory = false,
  updateHistory = []
}) {
  const { t, tWithParams } = useTranslation();
  
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">{t("reportDetails.title")}</h2>
              <p className="text-blue-100 text-sm mt-1">{tWithParams("reportDetails.issueNumber", { id: report.id })}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Status Badge */}
          <div className="px-6 pt-4 pb-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
              report.status === 'IN PROGRESS' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
              report.status === 'COMPLETED' ? 'bg-green-100 text-green-800 border border-green-200' :
              'bg-gray-100 text-gray-800 border border-gray-200'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                report.status === 'PENDING' ? 'bg-yellow-500' :
                report.status === 'IN PROGRESS' ? 'bg-blue-500' :
                report.status === 'COMPLETED' ? 'bg-green-500' :
                'bg-gray-500'
              }`}></div>
              {report.status}
            </span>
          </div>

          {/* Main Content */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Report Info */}
              <div className="space-y-6">
                {/* Description */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{t("reportDetails.fields.description")}</h3>
                  <p className="text-gray-900 text-base leading-relaxed">{report.description}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("reportDetails.fields.category")}</h4>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                      <span className="text-gray-900 font-medium">{report.category}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("reportDetails.fields.location")}</h4>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-gray-900 font-medium">{report.customLocation}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("reportDetails.fields.reportedBy")}</h4>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-blue-600 font-semibold text-sm">
                          {report.reportedBy?.username?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-gray-900 font-medium">{report.reportedBy?.username}</span>
                    </div>
                  </div>

                  {report.assignedTo && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("reportDetails.fields.assignedTo")}</h4>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-green-600 font-semibold text-sm">
                            {report.assignedTo?.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-gray-900 font-medium">{report.assignedTo?.name}</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("reportDetails.fields.reportedAt")}</h4>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-900 font-medium text-sm">
                        {new Date(report.createdAt).toLocaleString("en-GB", {
                          timeZone: "Asia/Bangkok",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Update History for Assigned Reports */}
                {showUpdateHistory && updateHistory.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">{t("reportDetails.updateHistory")}</h3>
                    <div className="space-y-3">
                      {updateHistory.map((update, index) => (
                        <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {tWithParams("reportDetails.statusUpdate", { status: update.status })}
                              </span>
                              {(update.resolutionType || update.remark) && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  (update.resolutionType === 'OK' || update.remark === 'OK') ? 'bg-green-100 text-green-800' :
                                  (update.resolutionType === 'RF' || update.remark === 'RF') ? 'bg-orange-100 text-orange-800' :
                                  (update.resolutionType === 'PR' || update.remark === 'PR') ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {update.resolutionType || update.remark}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {update.updateTime ? new Date(update.updateTime).toLocaleString("en-GB", {
                                timeZone: "Asia/Bangkok",
                              }) : "Invalid Date"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{update.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Media */}
              <div className="space-y-6">
                {report.photoUrls?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      {tWithParams("reportDetails.media.photos", { count: report.photoUrls.length })}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {report.photoUrls.map((photo, i) => {
                        const base = `${photo}${sastoken}`;
                        const joiner = base.includes("?") ? "&" : "?";
                        const inlineUrl = `${base}${joiner}rscd=inline&rsct=image/jpeg`;
                        return (
                          <div key={i} className="group relative">
                            <img
                              src={inlineUrl}
                              alt={tWithParams("reportDetails.media.photoAlt", { number: i + 1 })}
                              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 cursor-pointer transition-all duration-200 group-hover:border-blue-300 group-hover:shadow-lg"
                              onClick={() => onMediaView(base, "image")}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200 flex items-center justify-center pointer-events-none">
                              <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {report.videoUrls?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      {tWithParams("reportDetails.media.videos", { count: report.videoUrls.length })}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {report.videoUrls.map((video, i) => {
                        const base = `${video}${sastoken}`;
                        const joiner = base.includes("?") ? "&" : "?";
                        const inlineUrl = `${base}${joiner}rscd=inline&rsct=video/mp4`;
                        return (
                          <div key={i} className="group relative">
                            <video
                              src={inlineUrl}
                              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 cursor-pointer transition-all duration-200 group-hover:border-blue-300 group-hover:shadow-lg"
                              onClick={() => onMediaView(base, "video")}
                              onMouseEnter={(e) => e.target.play()}
                              onMouseLeave={(e) => {e.target.pause(); e.target.currentTime = 0;}}
                              muted
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 group-hover:bg-black/70 transition-all duration-200">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(!report.photoUrls?.length && !report.videoUrls?.length) && (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 font-medium">{t("reportDetails.media.noMedia")}</p>
                    <p className="text-gray-400 text-sm mt-1">{t("reportDetails.media.noMediaDesc")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}