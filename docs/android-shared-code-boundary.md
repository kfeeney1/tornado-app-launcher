# Android shared-code boundary

Android is a platform host for the same Tornado React/Vite product used by Web and Windows. Product state, authentication, cloud profile/configuration, sync behaviour, navigation models and launcher configuration remain shared code unless a platform capability genuinely requires an adapter.

Native Android code should provide platform capabilities only. It must not become a parallel implementation of Tornado business logic.
