'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const emotionEmojis = {
  'Alegría': '😊',
  'Tristeza': '😢',
  'Neutral': '😐',
  'Ira': '😠',
  'Miedo': '😨',
  'Sorpresa': '😮',
};

// Config fetch to use the same base URL from the environment variable
const fetch = (url, options) => window.fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${url}`, options);

const EmotionAnalysis = () => {
  const [sentence, setSentence] = useState('');
  const [emotions, setEmotions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [resultId, setResultId] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [alternativeEmotions, setAlternativeEmotions] = useState([]);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState(null);

  const analyzeEmotion = async () => {
    setLoading(true);
    setEmotions(null);
    setSelectedEmotion(null);
    setResultId(null);
    setAlternativeEmotions([]);
    setShowFeedback(false);
    setFeedbackSent(false);
    setFeedbackMessage('');
    setConsentGiven(false);
    try {
      const response = await fetch(`/emotion?sentence=${encodeURIComponent(sentence)}`);
      const data = await response.json();
      const processedData = Object.entries(data.probs)
        .map(([name, value]) => ({ 
          name, 
          value: Math.round(value * 100), 
          emoji: emotionEmojis[name] || ''
        }));
      setEmotions(processedData);
      setSelectedEmotion(data.emocion);
      setResultId(data.id);
    } catch (error) {
      console.error('Error al analizar la emoción:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && sentence) {
      analyzeEmotion();
    }
  };

  const prepareFeedback = (like) => {
    setPendingFeedback({ like, alternativeEmotions: like ? [] : alternativeEmotions });
    setShowConsentModal(true);
  };

  const submitFeedback = async () => {
    if (!resultId || !pendingFeedback) return;
    
    const { like, alternativeEmotions } = pendingFeedback;
    const feedbackUrl = `/evaluate?id=${resultId}&like=${like}${!like ? `&alternatives=${alternativeEmotions.join(',')}` : ''}`;
    try {
      await fetch(feedbackUrl, { method: 'POST' });
      setFeedbackSent(true);
      setFeedbackMessage('¡Gracias por ayudarme a mejorar!');
    } catch (error) {
      console.error('Error al enviar feedback:', error);
      setFeedbackMessage('Hubo un error al enviar el feedback. Por favor, intenta de nuevo.');
    }
    setShowConsentModal(false);
    setPendingFeedback(null);
  };

  const handleConsentResponse = (consent) => {
    setConsentGiven(consent);
    if (consent) {
      submitFeedback();
    } else {
      setFeedbackSent(true);
      setFeedbackMessage('¡Gracias por tu respuesta! No se guardará ninguna información.');
    }
    setShowConsentModal(false);
  };

  const handleAlternativeEmotionChange = (emotion) => {
    setAlternativeEmotions(prev => 
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-purple-100 to-blue-200">
      <Card className="max-w-4xl mx-auto shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-purple-800">
            Análisis de Emociones con IA
          </CardTitle>
          <p className="mt-2 text-center text-gray-600">
            Escribí algo y el robot te mostrará la emoción del texto
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              type="text"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ingresa una oración para analizar..."
              className="w-full p-2 text-lg"
            />
            <Button 
              onClick={analyzeEmotion}
              disabled={loading || !sentence}
              className="w-full mt-4 text-white bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                'Analizar Emoción'
              )}
            </Button>
          </div>
          
          <div className="mt-8 min-h-[300px] flex items-center justify-center">
            {loading ? (
              <div className="text-center">
                <Loader2 className="w-16 h-16 mx-auto text-purple-600 animate-spin" />
                <p className="mt-4 text-lg text-purple-800">Analizando emociones...</p>
              </div>
            ) : emotions ? (
              <div className="w-full">
                <h2 className="mb-4 text-2xl font-semibold text-center text-purple-800">
                  Resultados del Análisis
                </h2>
                {selectedEmotion && (
                  <p className="mb-4 text-xl text-center">
                    Emoción detectada: <span className="font-bold text-purple-600">{selectedEmotion} {emotionEmojis[selectedEmotion]}</span>
                  </p>
                )}
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emotions}>
                      <XAxis dataKey="name" tickFormatter={(value) => `${value} ${emotionEmojis[value]}`} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="value">
                        {emotions.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.name === selectedEmotion ? '#FF6B6B' : '#8884d8'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {!feedbackSent && !showFeedback && (
                  <div className="flex justify-center mt-6 space-x-4">
                    <Button onClick={() => prepareFeedback(true)} className="bg-green-500 hover:bg-green-600">
                      <ThumbsUp className="w-4 h-4 mr-2" /> Correcto
                    </Button>
                    <Button onClick={() => setShowFeedback(true)} className="bg-red-500 hover:bg-red-600">
                      <ThumbsDown className="w-4 h-4 mr-2" /> Incorrecto
                    </Button>
                  </div>
                )}
                {showFeedback && !feedbackSent && (
                  <div className="mt-6">
                    <h3 className="mb-2 text-lg font-semibold">Seleccioná las emociones correctas:</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                      {Object.entries(emotionEmojis).map(([emotion, emoji]) => (
                        <div key={emotion} className="flex items-center space-x-2">
                          <Checkbox 
                            id={emotion} 
                            checked={alternativeEmotions.includes(emotion)}
                            onCheckedChange={() => handleAlternativeEmotionChange(emotion)}
                          />
                          <Label htmlFor={emotion}>{emotion} {emoji}</Label>
                        </div>
                      ))}
                    </div>
                    <Button 
                      onClick={() => prepareFeedback(false)} 
                      className="mt-4 bg-blue-500 hover:bg-blue-600"
                      disabled={alternativeEmotions.length === 0}
                    >
                      Enviar feedback
                    </Button>
                  </div>
                )}
                {feedbackSent && (
                  <Alert className="mt-4">
                    <AlertDescription>{feedbackMessage}</AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <p className="text-lg text-center text-gray-600">
                Ingresá una oración y presioná "Analizar Emoción" para comenzar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Consentimiento de uso de datos</DialogTitle>
            <DialogDescription>
              ¿Estás de acuerdo con que la información compartida se guarde y se use con fines investigativos?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleConsentResponse(false)}>
              No acepto
            </Button>
            <Button onClick={() => handleConsentResponse(true)}>
              Acepto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmotionAnalysis;