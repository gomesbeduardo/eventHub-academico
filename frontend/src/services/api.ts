import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 401 no endpoint de auth (login/senha errada) é erro de credencial:
    // deixa a própria página tratar e exibir a mensagem. Só forçamos logout +
    // redirect quando é sessão expirada numa rota protegida.
    const url: string = err.config?.url ?? "";
    const isAuthRoute = url.includes("/auth/");
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export function getRecommendations(participantId: string) {
  return api.get(`/recommendations/${participantId}`);
}

export default api;
